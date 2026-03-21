import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ApiError, createApiRouter, validateGeneratePayload, validateUploadedFile } from "../api/generate.js";
import { createApp, getStartupEnvDiagnostics } from "../server.js";
import { createDoubaoRequestBody, generatePoster, resolveImageSize } from "../utils/doubao.js";
import { buildPrompt } from "../utils/prompt-builder.js";
import { filterSensitiveText } from "../utils/sensitive-filter.js";

test("buildPrompt creates the default structured prompt", () => {
  const result = buildPrompt({
    posterType: "festival",
    aspectRatio: "weibo",
    title: "周年庆典",
    subtitle: "欢迎全员参加",
    styleDesc: "喜庆热闹",
    logoUrl: "https://cdn.example.com/logo.png",
    referenceImageUrl: "https://cdn.example.com/reference.png",
    negativePrompt: "不要人物",
  });

  assert.equal(result.usedCustomPrompt, false);
  assert.match(result.prompt, /周年庆典/);
  assert.match(result.prompt, /欢迎全员参加/);
  assert.match(result.prompt, /喜庆热闹/);
  assert.match(result.prompt, /参考上传图片的配色与氛围/);
  assert.match(result.prompt, /中心构图|保留排版留白/);
  assert.match(result.negativePrompt, /不要人物/);
  assert.equal(result.metadata.aspectRatioLabel, "1:1");
  assert.equal(result.metadata.effectiveClarity, "high");
  assert.equal(result.metadata.sizeTemplate, "正方形海报");
});

test("buildPrompt keeps custom prompt unchanged when autoEnhance is disabled", () => {
  const result = buildPrompt({
    title: "内部通知",
    customPrompt: "蓝色的天空飞着一条龙",
    negativePrompt: "不要复杂背景",
    logoPosition: "top_left",
    logoUrl: "https://cdn.example.com/logo.png",
    autoEnhance: false,
  });

  assert.equal(result.usedCustomPrompt, true);
  assert.equal(result.prompt, "蓝色的天空飞着一条龙");
  assert.equal(result.metadata.autoEnhance, false);
  assert.equal(result.negativePrompt, "不要复杂背景");
  assert.equal(result.metadata.logoPositionLabel, "左上角");
});

test("buildPrompt enriches prompt spec when autoEnhance is enabled", () => {
  const result = buildPrompt({
    posterType: "brand",
    aspectRatio: "16:9",
    clarity: "auto",
    autoEnhance: true,
    title: "新品海报",
    customPrompt: "高端护肤品海报，冰川蓝，高级感",
  });

  assert.equal(result.usedCustomPrompt, true);
  assert.match(result.prompt, /高端护肤品/);
  assert.match(result.prompt, /高端商业产品摄影|商业产品海报/);
  assert.match(result.prompt, /横向展开画面/);
  assert.match(result.prompt, /高细节表现/);
  assert.equal(result.metadata.aspectRatioLabel, "16:9");
  assert.equal(result.metadata.effectiveClarity, "high");
  assert.equal(result.metadata.providerSize, "1792x1024");
  assert.match(result.promptSpec.material, /玻璃|金属/);
});

test("buildPrompt ignores non-string customPrompt values instead of coercing them into object text", () => {
  const result = buildPrompt({
    title: "品牌海报",
    customPrompt: { value: "错误类型" },
    styleDesc: "现代简约",
  });

  assert.equal(result.usedCustomPrompt, false);
  assert.doesNotMatch(result.prompt, /\[object Object\]/);
  assert.match(result.prompt, /品牌/);
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

test("validateGeneratePayload rejects unsupported enum values", () => {
  assert.throws(
    () =>
      validateGeneratePayload({
        title: "无效尺寸",
        sizeTemplate: "billboard",
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "VALIDATION_ERROR" &&
      /sizeTemplate 无效/.test(error.message),
  );
});

test("validateGeneratePayload normalizes new generation preferences", () => {
  const result = validateGeneratePayload({
    title: "偏好映射测试",
    aspectRatio: "16:9",
    clarity: "auto",
    autoEnhance: "false",
  });

  assert.equal(result.aspectRatio, "wechat_cover");
  assert.equal(result.sizeTemplate, "wechat_cover");
  assert.equal(result.clarity, "auto");
  assert.equal(result.autoEnhance, false);
});

test("validateGeneratePayload rejects invalid aspectRatio", () => {
  assert.throws(
    () =>
      validateGeneratePayload({
        title: "错误比例",
        aspectRatio: "21:9",
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "VALIDATION_ERROR" &&
      /aspectRatio 无效/.test(error.message),
  );
});

test("validateGeneratePayload rejects blocked sensitive prompt content", () => {
  assert.throws(
    () =>
      validateGeneratePayload({
        title: "敏感内容测试",
        customPrompt: "选举海报，国家领导人肖像，正式宣传风格。",
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "SENSITIVE_PROMPT" &&
      /Doubao 容易拦截/.test(error.message),
  );
});

test("filterSensitiveText preserves whitelisted mythical creature words", () => {
  const result = filterSensitiveText("蓝色的天空飞着一条龙，远处还有凤凰", {
    strict: false,
  });

  assert.equal(result.value, "蓝色的天空飞着一条龙，远处还有凤凰");
  assert.deepEqual(result.blocked, []);
  assert.deepEqual(result.replacements, []);
});

test("validateGeneratePayload accepts dragon prompts", () => {
  const result = validateGeneratePayload({
    title: "神话场景",
    customPrompt: "蓝色的天空飞着一条龙",
  });

  assert.equal(result.customPrompt, "蓝色的天空飞着一条龙");
});

test("validateGeneratePayload rejects unexpected fields and non-string values", () => {
  assert.throws(
    () =>
      validateGeneratePayload({
        title: "参数校验",
        styleDesc: { invalid: true },
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "VALIDATION_ERROR" &&
      /styleDesc 必须是字符串/.test(error.message),
  );

  assert.throws(
    () =>
      validateGeneratePayload({
        title: "参数校验",
        admin: "true",
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.code === "VALIDATION_ERROR" &&
      /不支持的字段/.test(error.message),
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

test("createDoubaoRequestBody appends negative prompt with a compact instruction", () => {
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
  assert.equal(body.prompt, "生成海报\n避免：不要低清晰度");
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

test("createDoubaoRequestBody omits image when no reference images are provided", () => {
  const body = createDoubaoRequestBody({
    prompt: "生成品牌海报",
    referenceImages: [],
  });

  assert.equal("image" in body, false);
});

test("resolveImageSize keeps poster ratios within the supported range", () => {
  assert.equal(resolveImageSize("mobile"), "1024x1792");
  assert.equal(resolveImageSize("wechat_cover"), "1792x1024");
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

test("generatePoster returns a friendly error for upstream sensitive blocks", async () => {
  await assert.rejects(
    () =>
      generatePoster({
        prompt: "生成品牌海报",
        apiKey: "test-key",
        maxRetries: 1,
        sleepImpl: async () => {},
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              error: {
                message: "The request failed because the input text may contain sensitive information.",
              },
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          ),
      }),
    /内容安全拦截/,
  );
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

    const [generateRateLimit, maybeHandleMultipart, handleGenerate] = routes.get("/generate");
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
      generateRateLimit(request, response, (error) => {
        if (error) {
          reject(error);
          return;
        }

        maybeHandleMultipart(request, response, (multipartError) => {
          if (multipartError) {
            reject(multipartError);
            return;
          }

          resolve();
        });
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

test("createApiRouter forwards mapped provider size and clarity from preferences", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "ai-poster-generator-test-"));
  const routes = new Map();
  let receivedPayload;

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
      generatePosterImpl: async ({ sizeTemplate, size, clarity, prompt, negativePrompt }) => {
        receivedPayload = { sizeTemplate, size, clarity, prompt, negativePrompt };
        return {
          imageUrl: "https://cdn.example.com/generated.png",
          provider: "doubao-seed",
          attempts: 1,
        };
      },
    });

    const [, , handleGenerate] = routes.get("/generate");
    const request = {
      posterRequestId: "req-mapped-prefs",
      is: () => false,
      files: {},
      body: {
        title: "参数映射测试",
        posterType: "brand",
        aspectRatio: "16:9",
        clarity: "auto",
        autoEnhance: "true",
        customPrompt: "运动品牌春季海报，女生晨跑，干净有力量",
      },
      protocol: "https",
      get(headerName) {
        if (headerName === "host") {
          return "poster.example.com";
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
    assert.equal(receivedPayload.sizeTemplate, "wechat_cover");
    assert.equal(receivedPayload.size, "1792x1024");
    assert.equal(receivedPayload.clarity, "high");
    assert.match(receivedPayload.prompt, /横向展开画面|保留左右叙事空间/);
    assert.match(receivedPayload.negativePrompt, /低清晰度|压缩痕迹/);
    assert.equal(response.payload?.data?.effectiveProfile?.effectiveClarity, "high");
    assert.equal(response.payload?.data?.effectiveProfile?.size, "1792x1024");
    assert.match(response.payload?.data?.promptSpec?.composition || "", /横向展开画面/);
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

    const [, , handleGenerate] = routes.get("/generate");
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

test("createApiRouter passes an empty referenceImages array when logo and reference image are both omitted", async () => {
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

    const [, , handleGenerate] = routes.get("/generate");
    const request = {
      posterRequestId: "req-no-assets",
      is: () => false,
      files: {},
      body: {
        title: "无素材海报",
        logoUrl: "   ",
        referenceImageUrl: "   ",
      },
      protocol: "https",
      get(headerName) {
        if (headerName === "host") {
          return "poster.example.com";
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
    assert.deepEqual(receivedReferenceImages, []);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload?.success, true);
  } finally {
    rmSync(uploadDir, { recursive: true, force: true });
  }
});

test("createApiRouter maps upstream sensitive errors to a friendly 400 response", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "ai-poster-generator-test-"));
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
      apiKey: "explicit-router-key",
      generatePosterImpl: async () => {
        throw new Error("Doubao API 请求失败（400）：当前描述触发内容安全拦截，请调整后重试。");
      },
    });

    const [, , handleGenerate] = routes.get("/generate");
    const request = {
      posterRequestId: "req-sensitive-upstream",
      is: () => false,
      files: {},
      body: {
        title: "友好提示测试",
      },
      protocol: "https",
      get(headerName) {
        if (headerName === "host") {
          return "poster.example.com";
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

    assert.ok(forwardedError instanceof ApiError);
    assert.equal(forwardedError.statusCode, 400);
    assert.equal(forwardedError.code, "SENSITIVE_PROMPT");
    assert.match(forwardedError.message, /政治、暴力、成人或违法相关词语/);
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

test("createApiRouter rate limits repeated generate requests from the same client", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "ai-poster-generator-test-"));
  const routes = new Map();
  let invocationCount = 0;

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
      rateLimitMaxRequests: 1,
      rateLimitWindowMs: 60_000,
      nowImpl: () => 1_000,
      generatePosterImpl: async () => {
        invocationCount += 1;
        return {
          imageUrl: "https://cdn.example.com/generated.png",
          provider: "doubao-seed",
          attempts: 1,
        };
      },
    });

    const [generateRateLimit, maybeHandleMultipart, handleGenerate] = routes.get("/generate");
    const createRequest = () => ({
      posterRequestId: "req-rate-limit",
      is: () => false,
      files: {},
      body: {
        title: "频率限制测试",
      },
      ip: "203.0.113.1",
      protocol: "https",
      get(headerName) {
        if (headerName === "host") {
          return "poster.example.com";
        }

        return undefined;
      },
    });
    const createResponse = () => {
      const headers = {};

      return {
        headers,
        statusCode: 200,
        payload: null,
        setHeader(name, value) {
          headers[name] = value;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.payload = payload;
          return this;
        },
      };
    };

    const firstRequest = createRequest();
    const firstResponse = createResponse();
    let firstError;
    await new Promise((resolve, reject) => {
      generateRateLimit(firstRequest, firstResponse, (error) => {
        if (error) {
          reject(error);
          return;
        }

        maybeHandleMultipart(firstRequest, firstResponse, (multipartError) => {
          if (multipartError) {
            reject(multipartError);
            return;
          }

          resolve();
        });
      });
    });
    await handleGenerate(firstRequest, firstResponse, (error) => {
      firstError = error;
    });

    const secondRequest = createRequest();
    const secondResponse = createResponse();
    let secondError;
    await generateRateLimit(secondRequest, secondResponse, (error) => {
      secondError = error;
    });

    assert.equal(firstError, undefined);
    assert.equal(invocationCount, 1);
    assert.ok(secondError instanceof ApiError);
    assert.equal(secondError.statusCode, 429);
    assert.equal(secondError.code, "RATE_LIMITED");
    assert.equal(secondResponse.headers["Retry-After"], "60");
  } finally {
    rmSync(uploadDir, { recursive: true, force: true });
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
