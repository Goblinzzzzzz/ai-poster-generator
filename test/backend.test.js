import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, validateGeneratePayload, validateUploadedFile } from "../api/generate.js";
import { createDoubaoRequestBody, generatePoster, resolveImageSize } from "../utils/doubao.js";
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
  assert.match(result.prompt, /包含 Logo：是/);
  assert.match(result.prompt, /已上传参考图/);
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
    sizeTemplate: "mobile",
  });

  assert.equal(body.model, "doubao-seedream-4-0-250828");
  assert.equal(body.response_format, "b64_json");
  assert.equal(body.size, "1024x1792");
  assert.match(body.prompt, /不要低清晰度/);
});

test("createDoubaoRequestBody includes normalized reference images", () => {
  const body = createDoubaoRequestBody({
    prompt: "生成品牌海报",
    referenceImages: [
      "https://cdn.example.com/reference.png",
      "data:image/png;base64,abc123==",
      "https://cdn.example.com/reference.png",
      "invalid-value",
    ],
  });

  assert.deepEqual(body.image, [
    "https://cdn.example.com/reference.png",
    "data:image/png;base64,abc123==",
  ]);
});

test("resolveImageSize keeps poster ratios within the supported range", () => {
  assert.equal(resolveImageSize("mobile"), "1024x1792");
  assert.equal(resolveImageSize("wechat_cover"), "1792x768");
});

test("generatePoster rejects requests when API key is missing", async () => {
  await assert.rejects(
    () =>
      generatePoster({
        prompt: "生成培训海报",
        apiKey: "",
      }),
    /DOUBAO_API_KEY 未配置/,
  );
});

test("generatePoster retries and extracts a data url from b64_json", async () => {
  let attempts = 0;

  const result = await generatePoster({
    prompt: "生成品牌海报",
    apiKey: "test-key",
    sizeTemplate: "weibo",
    maxRetries: 3,
    sleepImpl: async () => {},
    fetchImpl: async () => {
      attempts += 1;

      if (attempts < 3) {
        return new Response("upstream error", { status: 502 });
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              b64_json: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s4P4n8AAAAASUVORK5CYII=",
              mime_type: "image/png",
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
  assert.match(result.imageUrl, /^data:image\/png;base64,/);
});

test("generatePoster normalizes direct base64 image responses", async () => {
  const rawBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s4P4n8AAAAASUVORK5CYII=";
  let requestBody;

  const result = await generatePoster({
    prompt: "生成品牌海报",
    apiKey: "test-key",
    referenceImages: ["https://cdn.example.com/logo.png"],
    sleepImpl: async () => {},
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);

      return new Response(
        JSON.stringify({
          imageUrl: rawBase64,
          mime_type: "image/png",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    },
  });

  assert.deepEqual(requestBody.image, ["https://cdn.example.com/logo.png"]);
  assert.equal(result.imageUrl, `data:image/png;base64,${rawBase64}`);
});
