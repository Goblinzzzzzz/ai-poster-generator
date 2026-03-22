import { mkdirSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { extname, join } from "node:path";

import { generatePoster as generateDoubaoPoster } from "../utils/doubao.js";
import { describeEnvValue, normalizeEnvValue } from "../utils/env.js";
import { generatePoster as generateGeminiPoster } from "../utils/gemini.js";
import {
  getSupportedClarityValues,
  isSupportedAspectRatio,
  isSupportedClarity,
  normalizeAutoEnhance,
} from "../utils/parameter-mapping.js";
import { buildPrompt, normalizePromptInput } from "../utils/prompt-builder.js";
import {
  createSensitivePromptMessage,
  filterSensitivePayload,
  isDoubaoSensitiveError,
  normalizeInputText,
} from "../utils/sensitive-filter.js";

const ONE_MB = 1024 * 1024;
const STALE_UPLOAD_MS = 24 * 60 * 60 * 1000;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const FILE_SIZE_LIMITS = {
  logo: 5 * ONE_MB,
  referenceImage: 10 * ONE_MB,
  file: 10 * ONE_MB,
};
const DEFAULT_GENERATE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_GENERATE_RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_GENERATE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_GENERATE_RATE_LIMIT_MAX_REQUESTS = 100;
const ALLOWED_POSTER_TYPES = new Set(["training", "culture", "brand", "festival", "notice"]);
const ALLOWED_SIZE_TEMPLATES = new Set(["mobile", "a4", "wechat_cover", "wechat_sub", "weibo"]);
const ALLOWED_LOGO_POSITIONS = new Set(["auto", "top_left", "top_right", "bottom_left", "bottom_right"]);
const ALLOWED_GENERATE_FIELDS = new Set([
  "posterType",
  "sizeTemplate",
  "aspectRatio",
  "clarity",
  "autoEnhance",
  "mode",
  "title",
  "subtitle",
  "styleDesc",
  "customPrompt",
  "negativePrompt",
  "logoPosition",
  "logoUrl",
  "referenceImageUrl",
  "selectedModel",
]);
const HTTP_URL_PROTOCOLS = new Set(["http:", "https:"]);
const BOOLEAN_GENERATE_FIELDS = new Set(["autoEnhance"]);
const DEBUG_SCOPE = "[api/generate.js]";
const DEFAULT_SELECTED_MODEL = "doubao";
const MODEL_SELECTION_ALIASES = new Map([
  ["doubao", "doubao"],
  ["doubao-seed", "doubao"],
  ["doubao-seedream", "doubao"],
  ["gemini", "gemini"],
  ["google-gemini", "gemini"],
  ["gemini-image", "gemini"],
]);
const ALLOWED_SELECTED_MODELS = new Set(["doubao", "gemini"]);

const normalizeSelectedModel = (value) => {
  const normalized = normalizeInputText(value, 80).toLowerCase();

  if (!normalized) {
    return DEFAULT_SELECTED_MODEL;
  }

  return MODEL_SELECTION_ALIASES.get(normalized) || normalized;
};

const getSelectedModelLabel = (model) => (model === "gemini" ? "Gemini" : "Doubao");

const getRequestDebugId = (request) => String(request?.posterRequestId || "no-request-id");

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getClientAddress = (request) => {
  const forwardedFor = request.get?.("x-forwarded-for");

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim().slice(0, 128);
  }

  return normalizeInputText(request.ip || request.socket?.remoteAddress || request.connection?.remoteAddress, 128) || "unknown";
};

const parsePositiveInteger = (value, fallbackValue, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallbackValue;
  }

  return Math.min(max, Math.max(min, parsedValue));
};

const resolveGenerateRateLimitConfig = ({ windowMs, maxRequests } = {}) => ({
  windowMs: parsePositiveInteger(windowMs, DEFAULT_GENERATE_RATE_LIMIT_WINDOW_MS, {
    min: 1_000,
    max: MAX_GENERATE_RATE_LIMIT_WINDOW_MS,
  }),
  maxRequests: parsePositiveInteger(maxRequests, DEFAULT_GENERATE_RATE_LIMIT_MAX_REQUESTS, {
    min: 1,
    max: MAX_GENERATE_RATE_LIMIT_MAX_REQUESTS,
  }),
});

const logDebug = (message, details) => {
  console.error(`${DEBUG_SCOPE} ${message}`, details);
};

const logError = (message, details) => {
  console.error(`${DEBUG_SCOPE} ${message}`, details);
};

export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const createApiError = (statusCode, code, message, details) =>
  new ApiError(statusCode, code, message, details);

export const ensureUploadDir = (uploadDir) => {
  mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

export const cleanupStaleUploads = async (uploadDir, maxAgeMs = STALE_UPLOAD_MS) => {
  ensureUploadDir(uploadDir);
  const entries = await readdir(uploadDir, { withFileTypes: true });
  const now = Date.now();

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = join(uploadDir, entry.name);
        const fileStat = await stat(filePath);

        if (now - fileStat.mtimeMs > maxAgeMs) {
          await unlink(filePath).catch(() => {});
        }
      }),
  );
};

const createFilename = (fieldName, originalName = "upload") => {
  const ext = extname(originalName).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : ".png";
  const randomSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${fieldName}-${randomSuffix}${safeExt}`;
};

const safeUnlink = async (file) => {
  if (file?.path) {
    await unlink(file.path).catch(() => {});
  }
};

const getMaxFileSize = (fieldName) => FILE_SIZE_LIMITS[fieldName] || FILE_SIZE_LIMITS.file;

export const validateUploadedFile = (file, fieldName = "file") => {
  if (!file) {
    return null;
  }

  const extension = extname(file.originalname || "").toLowerCase();
  const hasValidMime = ALLOWED_MIME_TYPES.has(file.mimetype);
  const hasValidExtension = ALLOWED_EXTENSIONS.has(extension);

  if (!hasValidMime || !hasValidExtension) {
    throw createApiError(400, "INVALID_FILE_TYPE", "仅支持 PNG/JPG 图片上传。", {
      field: fieldName,
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
  }

  const sizeLimit = getMaxFileSize(fieldName);

  if (Number(file.size || 0) > sizeLimit) {
    throw createApiError(
      400,
      "FILE_TOO_LARGE",
      fieldName === "logo" ? "Logo 文件大小不能超过 5MB。" : "参考图文件大小不能超过 10MB。",
      { field: fieldName, size: file.size, limit: sizeLimit },
    );
  }

  return file;
};

export const validateGeneratePayload = (payload = {}) => {
  if (!isPlainObject(payload)) {
    throw createApiError(400, "VALIDATION_ERROR", "请求体格式无效。");
  }

  const unexpectedFields = Object.keys(payload).filter((fieldName) => !ALLOWED_GENERATE_FIELDS.has(fieldName));

  if (unexpectedFields.length > 0) {
    throw createApiError(400, "VALIDATION_ERROR", "请求包含不支持的字段。", {
      fields: unexpectedFields,
    });
  }

  for (const fieldName of ALLOWED_GENERATE_FIELDS) {
    const fieldValue = payload[fieldName];

    const isBooleanField = BOOLEAN_GENERATE_FIELDS.has(fieldName);
    const hasValidType =
      fieldValue === undefined ||
      fieldValue === null ||
      typeof fieldValue === "string" ||
      (isBooleanField && typeof fieldValue === "boolean");

    if (!hasValidType) {
      throw createApiError(400, "VALIDATION_ERROR", `${fieldName} 必须是字符串。`, {
        field: fieldName,
      });
    }
  }

  const rawAspectRatio = normalizeInputText(payload.aspectRatio, 40);
  const rawSizeTemplate = normalizeInputText(payload.sizeTemplate, 40);
  const rawClarity = normalizeInputText(payload.clarity, 40).toLowerCase();
  const rawSelectedModel = normalizeSelectedModel(payload.selectedModel);

  if (rawAspectRatio && !isSupportedAspectRatio(rawAspectRatio)) {
    throw createApiError(400, "VALIDATION_ERROR", "aspectRatio 无效。", {
      field: "aspectRatio",
    });
  }

  if (rawSizeTemplate && !ALLOWED_SIZE_TEMPLATES.has(rawSizeTemplate) && !isSupportedAspectRatio(rawSizeTemplate)) {
    throw createApiError(400, "VALIDATION_ERROR", "sizeTemplate 无效。", {
      field: "sizeTemplate",
      allowedValues: Array.from(ALLOWED_SIZE_TEMPLATES),
    });
  }

  if (rawClarity && !isSupportedClarity(rawClarity)) {
    throw createApiError(400, "VALIDATION_ERROR", "clarity 无效。", {
      field: "clarity",
      allowedValues: getSupportedClarityValues(),
    });
  }

  if (!ALLOWED_SELECTED_MODELS.has(rawSelectedModel)) {
    throw createApiError(400, "VALIDATION_ERROR", "selectedModel 无效。", {
      field: "selectedModel",
      allowedValues: Array.from(ALLOWED_SELECTED_MODELS),
    });
  }

  const normalized = normalizePromptInput(payload);
  normalized.selectedModel = rawSelectedModel;

  const sensitiveResult = filterSensitivePayload(normalized, { strict: true });

  if (sensitiveResult.blocked.length > 0) {
    throw createApiError(400, "SENSITIVE_PROMPT", createSensitivePromptMessage(sensitiveResult.blocked), {
      fields: Array.from(new Set(sensitiveResult.blocked.map((item) => item.field))),
      categories: Array.from(new Set(sensitiveResult.blocked.map((item) => item.category))),
    });
  }

  const filteredPayload = sensitiveResult.sanitized;

  if (!filteredPayload.title) {
    throw createApiError(400, "VALIDATION_ERROR", "标题不能为空。", {
      field: "title",
    });
  }

  if (!ALLOWED_POSTER_TYPES.has(filteredPayload.posterType)) {
    throw createApiError(400, "VALIDATION_ERROR", "posterType 无效。", {
      field: "posterType",
      allowedValues: Array.from(ALLOWED_POSTER_TYPES),
    });
  }

  if (!isSupportedAspectRatio(filteredPayload.aspectRatio)) {
    throw createApiError(400, "VALIDATION_ERROR", "aspectRatio 无效。", {
      field: "aspectRatio",
    });
  }

  if (!ALLOWED_SIZE_TEMPLATES.has(filteredPayload.sizeTemplate)) {
    throw createApiError(400, "VALIDATION_ERROR", "sizeTemplate 无效。", {
      field: "sizeTemplate",
      allowedValues: Array.from(ALLOWED_SIZE_TEMPLATES),
    });
  }

  if (!getSupportedClarityValues().includes(filteredPayload.clarity)) {
    throw createApiError(400, "VALIDATION_ERROR", "clarity 无效。", {
      field: "clarity",
      allowedValues: getSupportedClarityValues(),
    });
  }

  if (!ALLOWED_LOGO_POSITIONS.has(filteredPayload.logoPosition)) {
    throw createApiError(400, "VALIDATION_ERROR", "logoPosition 无效。", {
      field: "logoPosition",
      allowedValues: Array.from(ALLOWED_LOGO_POSITIONS),
    });
  }

  for (const fieldName of ["logoUrl", "referenceImageUrl"]) {
    const fieldValue = filteredPayload[fieldName];

    if (!fieldValue) {
      continue;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(fieldValue);
    } catch {
      throw createApiError(400, "VALIDATION_ERROR", `${fieldName} 必须是有效的 URL。`, {
        field: fieldName,
      });
    }

    if (!HTTP_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      throw createApiError(400, "VALIDATION_ERROR", `${fieldName} 仅支持 http(s) URL。`, {
        field: fieldName,
        protocol: parsedUrl.protocol,
      });
    }
  }

  filteredPayload.autoEnhance = normalizeAutoEnhance(filteredPayload.autoEnhance, true);
  filteredPayload.selectedModel = rawSelectedModel;

  return filteredPayload;
};

const createGenerateRateLimitMiddleware = ({ windowMs, maxRequests, nowImpl = Date.now } = {}) => {
  const resolvedConfig = resolveGenerateRateLimitConfig({ windowMs, maxRequests });
  const buckets = new Map();

  return (request, response, next) => {
    const now = nowImpl();
    const clientAddress = getClientAddress(request);

    for (const [bucketKey, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }

    const existingBucket = buckets.get(clientAddress);
    const bucket =
      existingBucket && existingBucket.resetAt > now
        ? existingBucket
        : {
            count: 0,
            resetAt: now + resolvedConfig.windowMs,
          };

    bucket.count += 1;
    buckets.set(clientAddress, bucket);

    const remaining = Math.max(resolvedConfig.maxRequests - bucket.count, 0);
    response.setHeader?.("X-RateLimit-Limit", String(resolvedConfig.maxRequests));
    response.setHeader?.("X-RateLimit-Remaining", String(remaining));
    response.setHeader?.("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > resolvedConfig.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

      response.setHeader?.("Retry-After", String(retryAfterSeconds));
      next(
        createApiError(429, "RATE_LIMITED", "生成请求过于频繁，请稍后重试。", {
          limit: resolvedConfig.maxRequests,
          windowMs: resolvedConfig.windowMs,
          retryAfterSeconds,
        }),
      );
      return;
    }

    next();
  };
};

const getForwardedHeaderValue = (request, headerName) => {
  const headerValue = request.get?.(headerName);

  if (typeof headerValue !== "string") {
    return "";
  }

  return headerValue
    .split(",")[0]
    .trim()
    .toLowerCase();
};

const getPublicRequestProtocol = (request) =>
  getForwardedHeaderValue(request, "x-forwarded-proto") || normalizeInputText(request.protocol, 20) || "http";

const getPublicRequestHost = (request) =>
  getForwardedHeaderValue(request, "x-forwarded-host") || normalizeInputText(request.get?.("host"), 255);

const buildPublicFileUrl = (request, file) => {
  const encodedName = encodeURIComponent(file.filename);
  const protocol = getPublicRequestProtocol(request);
  const host = getPublicRequestHost(request);

  return `${protocol}://${host}/uploads/${encodedName}`;
};

const pickFirstFile = (files, fieldName) => {
  const entry = files?.[fieldName];

  if (Array.isArray(entry) && entry.length > 0) {
    return entry[0];
  }

  return null;
};

const pickFiles = (files, fieldName) => {
  const entry = files?.[fieldName];

  if (!Array.isArray(entry)) {
    return [];
  }

  return entry.filter(Boolean);
};

const normalizeUploadKind = (requestBody = {}, files = {}) => {
  const explicitKind = normalizeInputText(requestBody.kind, 40);

  if (explicitKind === "logo" || explicitKind === "referenceImage") {
    return explicitKind;
  }

  if (pickFirstFile(files, "logo")) {
    return "logo";
  }

  if (pickFirstFile(files, "referenceImage")) {
    return "referenceImage";
  }

  return "file";
};

export const createApiRouter = ({
  Router,
  multer,
  uploadDir,
  apiKey,
  generatePosterImpl = generateDoubaoPoster,
  generateGeminiPosterImpl = generateGeminiPoster,
  rateLimitWindowMs = process.env.GENERATE_RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests = process.env.GENERATE_RATE_LIMIT_MAX_REQUESTS,
  nowImpl = Date.now,
}) => {
  if (!Router || !multer) {
    throw new Error("createApiRouter 需要传入 Express Router 和 multer。");
  }

  const normalizedApiKey = normalizeEnvValue(apiKey);
  const normalizedGeminiApiKey = normalizeEnvValue(process.env.GEMINI_API_KEY);

  if (!normalizedApiKey && !normalizedGeminiApiKey) {
    throw new Error("createApiRouter 需要传入至少一个可用的模型 API Key。");
  }

  ensureUploadDir(uploadDir);
  logDebug("createApiRouter initialized:", {
    uploadDir,
    doubaoApiKey: describeEnvValue(normalizedApiKey),
    geminiApiKey: describeEnvValue(normalizedGeminiApiKey),
  });

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_request, file, callback) => {
      callback(null, createFilename(file.fieldname, file.originalname));
    },
  });

  const upload = multer({
    storage,
    limits: {
      files: 6,
      fileSize: FILE_SIZE_LIMITS.referenceImage,
    },
    fileFilter: (_request, file, callback) => {
      const extension = extname(file.originalname || "").toLowerCase();
      const hasValidMime = ALLOWED_MIME_TYPES.has(file.mimetype);
      const hasValidExtension = ALLOWED_EXTENSIONS.has(extension);

      if (!hasValidMime || !hasValidExtension) {
        callback(createApiError(400, "INVALID_FILE_TYPE", "仅支持 PNG/JPG 图片上传。"));
        return;
      }

      callback(null, true);
    },
  });

  const router = Router();
  const generateUpload = upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "referenceImage", maxCount: 4 },
  ]);
  const generateRateLimit = createGenerateRateLimitMiddleware({
    windowMs: rateLimitWindowMs,
    maxRequests: rateLimitMaxRequests,
    nowImpl,
  });
  const standaloneUpload = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "referenceImage", maxCount: 4 },
  ]);

  const maybeHandleMultipart = (request, response, next) => {
    const isMultipart = request.is("multipart/form-data");

    logDebug("maybeHandleMultipart invoked:", {
      requestId: getRequestDebugId(request),
      contentType: request.get?.("content-type"),
      isMultipart,
    });

    if (isMultipart) {
      generateUpload(request, response, next);
      return;
    }

    next();
  };

  router.post("/generate", generateRateLimit, maybeHandleMultipart, async (request, response, next) => {
    const logoFile = pickFirstFile(request.files, "logo");
    const referenceImageFiles = pickFiles(request.files, "referenceImage");
    const requestId = getRequestDebugId(request);
    let selectedModel = normalizeSelectedModel(request.body?.selectedModel);

    try {
      logDebug("handling /generate request:", {
        requestId,
        body: request.body,
        fileFields: Object.keys(request.files || {}),
        protocol: request.protocol,
        forwardedProto: request.get?.("x-forwarded-proto"),
        host: request.get?.("host"),
        forwardedHost: request.get?.("x-forwarded-host"),
      });
      validateUploadedFile(logoFile, "logo");
      referenceImageFiles.forEach((file) => validateUploadedFile(file, "referenceImage"));

      const logoUrl = request.body?.logoUrl || (logoFile ? buildPublicFileUrl(request, logoFile) : "");
      const uploadedReferenceImageUrls = referenceImageFiles.map((file) => buildPublicFileUrl(request, file));
      const referenceImageUrl = request.body?.referenceImageUrl || uploadedReferenceImageUrls[0] || "";
      const normalizedPayload = validateGeneratePayload({
        ...request.body,
        logoUrl,
        referenceImageUrl,
      });
      selectedModel = normalizedPayload.selectedModel;
      const selectedModelLabel = getSelectedModelLabel(selectedModel);
      const selectedGenerator = selectedModel === "gemini" ? generateGeminiPosterImpl : generatePosterImpl;
      const providerApiKey = selectedModel === "gemini" ? normalizeEnvValue(process.env.GEMINI_API_KEY) : normalizedApiKey;

      if (!providerApiKey) {
        throw createApiError(
          503,
          selectedModel === "gemini" ? "GEMINI_NOT_CONFIGURED" : "DOUBAO_NOT_CONFIGURED",
          `${selectedModelLabel} API Key 未配置。`,
        );
      }

      const referenceImages = Array.from(
        new Set(
          [normalizedPayload.referenceImageUrl, ...uploadedReferenceImageUrls, normalizedPayload.logoUrl].filter(
            Boolean,
          ),
        ),
      ).slice(0, 4);
      const promptResult = buildPrompt(normalizedPayload);
      const promptSource = normalizedPayload.customPrompt ? "custom-prompt-direct" : "template-fallback";

      logDebug("prepared prompt and payload for generation:", {
        requestId,
        selectedModel,
        normalizedPayload,
        promptSource,
        publicAssetUrls: {
          logoUrl: normalizedPayload.logoUrl,
          referenceImageUrl: normalizedPayload.referenceImageUrl,
          referenceImageUrls: uploadedReferenceImageUrls,
        },
        promptLength: promptResult.prompt.length,
        negativePromptLength: promptResult.negativePrompt.length,
        doubaoApiKey: describeEnvValue(normalizedApiKey),
        geminiApiKey: describeEnvValue(normalizeEnvValue(process.env.GEMINI_API_KEY)),
      });

      if ([logoUrl, referenceImageUrl, ...uploadedReferenceImageUrls].some((url) => /^http:\/\//i.test(url))) {
        logError("generated public upload URL is using http; upstream image fetch may fail behind Railway proxy:", {
          requestId,
          selectedModel,
          logoUrl,
          referenceImageUrl,
          referenceImageUrls: uploadedReferenceImageUrls,
          protocol: request.protocol,
          forwardedProto: request.get?.("x-forwarded-proto"),
          host: request.get?.("host"),
          forwardedHost: request.get?.("x-forwarded-host"),
        });
      }

      logDebug("calling selected generation provider:", {
        requestId,
        selectedModel,
        selectedModelLabel,
        apiKey: describeEnvValue(providerApiKey),
        referenceImages,
      });
      const generationResult = await selectedGenerator({
        prompt: promptResult.prompt,
        negativePrompt: promptResult.negativePrompt,
        sizeTemplate: promptResult.parameterMapping.providerRequest.sizeTemplate,
        size: promptResult.parameterMapping.providerRequest.size,
        clarity: promptResult.parameterMapping.clarity.effective,
        apiKey: providerApiKey,
        referenceImages,
        requestId,
      });

      logDebug("selected generation provider succeeded:", {
        requestId,
        selectedModel,
        provider: generationResult.provider,
        attempts: generationResult.attempts,
        imageUrlPreview: String(generationResult.imageUrl || "").slice(0, 120),
      });

      response.status(200).json({
        success: true,
        imageUrl: generationResult.imageUrl,
        data: {
          imageUrl: generationResult.imageUrl,
          prompt: promptResult.prompt,
          negativePrompt: promptResult.negativePrompt,
          provider: generationResult.provider,
          selectedModel,
          attempts: generationResult.attempts,
          promptSpec: promptResult.promptSpec,
          effectiveProfile: promptResult.parameterMapping.effectiveProfile,
          uploads: {
            logoUrl,
            referenceImageUrl,
            referenceImageUrls: uploadedReferenceImageUrls,
          },
          metadata: {
            ...promptResult.metadata,
            usedCustomPrompt: promptResult.usedCustomPrompt,
            selectedModel,
          },
        },
      });
    } catch (error) {
      await Promise.all([safeUnlink(logoFile), ...referenceImageFiles.map((file) => safeUnlink(file))]);
      logError("generate route failed:", {
        requestId,
        selectedModel,
        doubaoApiKey: describeEnvValue(normalizedApiKey),
        geminiApiKey: describeEnvValue(normalizeEnvValue(process.env.GEMINI_API_KEY)),
        requestBody: request.body,
        uploads: {
          logoFile: logoFile
            ? {
                originalname: logoFile.originalname,
                mimetype: logoFile.mimetype,
                size: logoFile.size,
                filename: logoFile.filename,
                path: logoFile.path,
              }
            : null,
          referenceImageFiles: referenceImageFiles.map((file) => ({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            filename: file.filename,
            path: file.path,
          })),
        },
        protocol: request.protocol,
        forwardedProto: request.get?.("x-forwarded-proto"),
        host: request.get?.("host"),
        forwardedHost: request.get?.("x-forwarded-host"),
        errorName: error?.name,
        errorMessage: error?.message,
        stack: error?.stack,
      });

      if (error instanceof ApiError) {
        next(error);
        return;
      }

      const selectedModelLabel = getSelectedModelLabel(selectedModel);
      const message =
        typeof error?.message === "string" && error.message.trim()
          ? error.message.trim()
          : `${selectedModelLabel} 图片生成失败，请稍后重试。`;

      if (isDoubaoSensitiveError(message)) {
        next(
          createApiError(
            400,
            "SENSITIVE_PROMPT",
            "当前描述触发了内容安全拦截，请删减政治、暴力、成人或违法相关词语，改写为品牌、主体、材质、光线、配色等中性视觉描述后重试。",
          ),
        );
        return;
      }

      next(
        createApiError(
          /未配置/.test(message) ? 503 : 502,
          /未配置/.test(message)
            ? selectedModel === "gemini"
              ? "GEMINI_NOT_CONFIGURED"
              : "DOUBAO_NOT_CONFIGURED"
            : selectedModel === "gemini"
              ? "GEMINI_GENERATION_FAILED"
              : "DOUBAO_GENERATION_FAILED",
          message,
        ),
      );
    }
  });

  router.post("/upload", (request, response, next) => {
    standaloneUpload(request, response, async (error) => {
      if (error) {
        next(error);
        return;
      }

      const kind = normalizeUploadKind(request.body, request.files);
      const uploadedFile =
        pickFirstFile(request.files, kind) ||
        pickFirstFile(request.files, "file") ||
        pickFirstFile(request.files, "logo") ||
        pickFirstFile(request.files, "referenceImage");

      try {
        if (!uploadedFile) {
          throw createApiError(400, "VALIDATION_ERROR", "请上传图片文件。");
        }

        validateUploadedFile(uploadedFile, kind);
        const fileUrl = buildPublicFileUrl(request, uploadedFile);

        response.status(201).json({
          success: true,
          data: {
            field: kind,
            fileUrl,
            originalName: uploadedFile.originalname,
            mimeType: uploadedFile.mimetype,
            size: uploadedFile.size,
          },
        });
      } catch (uploadError) {
        await safeUnlink(uploadedFile);
        next(uploadError);
      }
    });
  });

  return router;
};
