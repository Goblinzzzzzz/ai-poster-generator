import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, validateGeneratePayload, validateUploadedFile } from "../api/generate.js";
import { createDoubaoRequestBody, generatePoster } from "../utils/doubao.js";
import { buildPrompt } from "../utils/prompt-builder.js";

test("buildPrompt creates the default structured prompt", () => {
  const result = buildPrompt({
    posterType: "festival",
    sizeTemplate: "weibo",
    title: "周年庆典",
    subtitle: "欢迎全员参加",
    styleDesc: "喜庆热闹",
    logoUrl: "https://cdn.example.com/logo.png",
    referenceImageUrl: "https://cdn.example.com/reference.png",
    negativePrompt: "不要人物",
  });

  assert.equal(result.usedCustomPrompt, false);
  assert.match(result.prompt, /请生成一张节日海报/);
  assert.match(result.prompt, /周年庆典/);
  assert.match(result.prompt, /不要人物/);
  assert.equal(result.metadata.sizeLabel, "1000×1000（微博海报）");
});

test("buildPrompt preserves custom prompt and appends constraints", () => {
  const result = buildPrompt({
    title: "内部通知",
    customPrompt: "使用扁平化设计，蓝绿色为主色调。",
    negativePrompt: "不要复杂背景",
    logoPosition: "top_left",
  });

  assert.equal(result.usedCustomPrompt, true);
  assert.match(result.prompt, /^使用扁平化设计/);
  assert.match(result.prompt, /补充约束：/);
  assert.match(result.prompt, /左上角/);
  assert.match(result.prompt, /不要复杂背景/);
});

test("validateGeneratePayload rejects missing title", () => {
  assert.throws(
    () => validateGeneratePayload({ subtitle: "缺少标题" }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "VALIDATION_ERROR" &&
      /标题不能为空/.test(error.message),
  );
});

test("validateUploadedFile enforces logo size limit", () => {
  assert.throws(
    () =>
      validateUploadedFile(
        {
          originalname: "logo.png",
          mimetype: "image/png",
          size: 6 * 1024 * 1024,
        },
        "logo",
      ),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "FILE_TOO_LARGE" &&
      /5MB/.test(error.message),
  );
});

test("createDoubaoRequestBody includes negative prompt in the user message", () => {
  const body = createDoubaoRequestBody({
    prompt: "生成海报",
    negativePrompt: "不要低清晰度",
  });

  assert.equal(body.model, "doubao-seed-2.0");
  assert.match(body.messages[1].content, /不要低清晰度/);
});

test("generatePoster returns local fallback when API key is missing", async () => {
  const result = await generatePoster({
    prompt: "生成培训海报",
    apiKey: "",
    fallbackInput: {
      posterType: "training",
      sizeTemplate: "mobile",
      title: "培训通知",
      subtitle: "周五下午两点",
      styleDesc: "专业严谨",
    },
  });

  assert.equal(result.provider, "local-fallback");
  assert.match(result.imageUrl, /^data:image\/svg\+xml;base64,/);
});

test("generatePoster retries and extracts image url from JSON content", async () => {
  let attempts = 0;

  const result = await generatePoster({
    prompt: "生成品牌海报",
    apiKey: "test-key",
    maxRetries: 3,
    sleepImpl: async () => {},
    fetchImpl: async () => {
      attempts += 1;

      if (attempts < 3) {
        return new Response("upstream error", { status: 502 });
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  imageUrl: "https://cdn.example.com/poster.png",
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    },
  });

  assert.equal(attempts, 3);
  assert.equal(result.provider, "doubao-seed");
  assert.equal(result.imageUrl, "https://cdn.example.com/poster.png");
});
