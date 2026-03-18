import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ApiError, createApiRouter, validateGeneratePayload, validateUploadedFile } from "../api/generate.js";
import { createApp, getStartupEnvDiagnostics } from "../server.js";
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
  assert.equal(body.sequential_image_generation, "disabled");
  assert.equal(body.stream, false);
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

test("createDoubaoRequestBody sends a single reference image as a string", () => {
  const body = createDoubaoRequestBody({
    prompt: "生成品牌海报",
    referenceImages: ["https://cdn.example.com/reference.png"],
  });

  assert.equal(body.image, "https://cdn.example.com/reference.png");
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

test("generatePoster rejects whitespace-only API keys", async () => {
  await assert.rejects(
    () =>
      generatePoster({
        prompt: "生成培训海报",
        apiKey: "   ",
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

  assert.equal(requestBody.image, "https://cdn.example.com/logo.png");
  assert.equal(result.imageUrl, `data:image/png;base64,${rawBase64}`);
});

test("createApiRouter requires an explicit apiKey", () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "ai-poster-generator-test-"));

  const Router = () => ({
    post() {
      return this;
    },
  });
  const multerStub = Object.assign(
    () => ({
      fields: () => (_request, _response, next) => next(),
    }),
    {
      diskStorage: () => ({}),
    },
  );

  try {
    assert.throws(
      () =>
        createApiRouter({
          Router,
          multer: multerStub,
          uploadDir,
        }),
      /createApiRouter 需要传入 apiKey/,
    );
  } finally {
    rmSync(uploadDir, { recursive: true, force: true });
  }
});

test("createApiRouter forwards the provided apiKey directly", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "ai-poster-generator-test-"));
  let receivedApiKey = "";
  let receivedRequestId = "";
  const routes = new Map();

  const Router = () => ({
    post(path, ...handlers) {
      routes.set(path, handlers);
      return this;
    },
  });
  const multerStub = Object.assign(
    () => ({
      fields: () => (_request, _response, next) => next(),
    }),
    {
      diskStorage: () => ({}),
    },
  );

  try {
    createApiRouter({
      Router,
      multer: multerStub,
      uploadDir,
      apiKey: "  explicit-router-key  ",
      generatePosterImpl: async ({ apiKey, requestId }) => {
        receivedApiKey = apiKey;
        receivedRequestId = requestId;
        return {
          imageUrl: "https://cdn.example.com/generated.png",
          provider: "doubao-seed",
          attempts: 1,
        };
      },
    });

    const [maybeHandleMultipart, handleGenerate] = routes.get("/generate");
    const request = {
      posterRequestId: "req-test-123",
      is: () => false,
      files: undefined,
      body: {
        title: "显式密钥测试",
      },
      protocol: "http",
      get: (headerName) => (headerName === "host" ? "localhost:3000" : undefined),
    };
    const response = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    await new Promise((resolve, reject) => {
      maybeHandleMultipart(request, response, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    let forwardedError;
    await handleGenerate(request, response, (error) => {
      forwardedError = error;
    });

    assert.equal(forwardedError, undefined);
    assert.equal(response.statusCode, 200);
    assert.equal(receivedApiKey, "explicit-router-key");
    assert.equal(receivedRequestId, "req-test-123");
  } finally {
    rmSync(uploadDir, { recursive: true, force: true });
  }
});

test("createApiRouter builds Railway-safe public upload urls from forwarded headers", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "ai-poster-generator-test-"));
  const routes = new Map();
  let receivedReferenceImages = [];

  const Router = () => ({
    post(path, ...handlers) {
      routes.set(path, handlers);
      return this;
    },
  });
  const multerStub = Object.assign(
    () => ({
      fields: () => (_request, _response, next) => next(),
    }),
    {
      diskStorage: () => ({}),
    },
  );

  try {
    createApiRouter({
      Router,
      multer: multerStub,
      uploadDir,
      apiKey: "explicit-router-key",
      generatePosterImpl: async ({ referenceImages }) => {
        receivedReferenceImages = referenceImages;
        return {
          imageUrl: "https://cdn.example.com/generated.png",
          provider: "doubao-seed",
          attempts: 1,
        };
      },
    });

    const [, handleGenerate] = routes.get("/generate");
    const request = {
      posterRequestId: "req-forwarded-headers",
      is: () => false,
      files: {
        logo: [
          {
            fieldname: "logo",
            originalname: "logo.png",
            mimetype: "image/png",
            size: 1024,
            filename: "logo-generated.png",
            path: join(uploadDir, "logo-generated.png"),
          },
        ],
      },
      body: {
        title: "代理头测试",
      },
      protocol: "http",
      get(headerName) {
        if (headerName === "host") {
          return "internal.railway";
        }

        if (headerName === "x-forwarded-host") {
          return "poster.example.com";
        }

        if (headerName === "x-forwarded-proto") {
          return "https";
        }

        return undefined;
      },
    };
    const response = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    let forwardedError;
    await handleGenerate(request, response, (error) => {
      forwardedError = error;
    });

    assert.equal(forwardedError, undefined);
    assert.deepEqual(receivedReferenceImages, ["https://poster.example.com/uploads/logo-generated.png"]);
  } finally {
    rmSync(uploadDir, { recursive: true, force: true });
  }
});

test("getStartupEnvDiagnostics reports Doubao env availability", () => {
  const previousApiKey = process.env.DOUBAO_API_KEY;
  const previousDoubaoKey = process.env.DOUBAO_KEY;
  const previousGenericApiKey = process.env.API_KEY;
  const previousEndpoint = process.env.DOUBAO_API_ENDPOINT;

  try {
    process.env.DOUBAO_API_KEY = "  runtime-test-key  ";
    delete process.env.DOUBAO_KEY;
    delete process.env.API_KEY;
    process.env.DOUBAO_API_ENDPOINT = "https://example.com/doubao";

    const diagnostics = getStartupEnvDiagnostics();

    assert.equal(diagnostics.hasDoubaoApiKey, true);
    assert.equal(diagnostics.doubaoApiKeyResolution.source, "process.env.DOUBAO_API_KEY");
    assert.equal(diagnostics.doubaoApiKeyResolution.details.first4Chars, "runt");
    assert.equal(diagnostics.doubaoApiKeyResolution.details.trimmedLength, 16);
    assert.equal(diagnostics.doubaoApiEndpoint, "https://example.com/doubao");
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.DOUBAO_API_KEY;
    } else {
      process.env.DOUBAO_API_KEY = previousApiKey;
    }

    if (previousDoubaoKey === undefined) {
      delete process.env.DOUBAO_KEY;
    } else {
      process.env.DOUBAO_KEY = previousDoubaoKey;
    }

    if (previousGenericApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousGenericApiKey;
    }

    if (previousEndpoint === undefined) {
      delete process.env.DOUBAO_API_ENDPOINT;
    } else {
      process.env.DOUBAO_API_ENDPOINT = previousEndpoint;
    }
  }
});

test("debug endpoint returns complete environment diagnostics", async () => {
  const previousApiKey = process.env.DOUBAO_API_KEY;
  const previousDoubaoKey = process.env.DOUBAO_KEY;
  const previousGenericApiKey = process.env.API_KEY;
  const previousEndpoint = process.env.DOUBAO_API_ENDPOINT;
  let app;

  try {
    delete process.env.DOUBAO_API_KEY;
    process.env.DOUBAO_KEY = "railway-debug-key";
    delete process.env.API_KEY;
    process.env.DOUBAO_API_ENDPOINT = "https://example.com/debug-doubao";
    app = createApp();

    const debugLayer = app._router.stack.find((layer) => layer.route?.path === "/api/debug-env");
    assert.ok(debugLayer);

    const request = {
      posterRequestId: "req-debug-env",
    };
    const response = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    await debugLayer.route.stack[0].handle(request, response);
    const payload = response.payload;

    assert.equal(response.statusCode, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.requestId, "req-debug-env");
    assert.equal(payload.data.doubaoApiKeyResolution.source, "process.env.DOUBAO_KEY");
    assert.equal(payload.data.doubaoApiKeyResolution.details.first4Chars, "rail");
    assert.equal(payload.data.allEnvironmentVariables.DOUBAO_KEY, "railway-debug-key");
    assert.equal(payload.data.startup.doubaoApiKeyCandidates.DOUBAO_KEY.first4Chars, "rail");
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.DOUBAO_API_KEY;
    } else {
      process.env.DOUBAO_API_KEY = previousApiKey;
    }

    if (previousDoubaoKey === undefined) {
      delete process.env.DOUBAO_KEY;
    } else {
      process.env.DOUBAO_KEY = previousDoubaoKey;
    }

    if (previousGenericApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousGenericApiKey;
    }

    if (previousEndpoint === undefined) {
      delete process.env.DOUBAO_API_ENDPOINT;
    } else {
      process.env.DOUBAO_API_ENDPOINT = previousEndpoint;
    }
  }
});
