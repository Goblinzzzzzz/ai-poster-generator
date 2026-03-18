import { mkdirSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { extname, join } from "node:path";

import { generatePoster } from "../utils/doubao.js";
import { describeEnvValue, normalizeEnvValue } from "../utils/env.js";
import { buildPrompt } from "../utils/prompt-builder.js";

const ONE_MB = 1024 * 1024;
const STALE_UPLOAD_MS = 24 * 60 * 60 * 1000;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const FILE_SIZE_LIMITS = {
  logo: 5 * ONE_MB,
  referenceImage: 10 * ONE_MB,
  file: 10 * ONE_MB,
};
const DEBUG_SCOPE = "[api/generate.js]";

const sanitizeText = (value, maxLength = 1000) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const getRequestDebugId = (request) => String(request?.posterRequestId || "no-request-id");

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
  const normalized = {
    posterType: sanitizeText(payload.posterType, 40) || "training",
    sizeTemplate: sanitizeText(payload.sizeTemplate, 40) || "mobile",
    title: sanitizeText(payload.title, 50),
    subtitle: sanitizeText(payload.subtitle, 200),
    styleDesc: sanitizeText(payload.styleDesc, 120),
    customPrompt: String(payload.customPrompt || "").trim().slice(0, 1000),
    negativePrompt: sanitizeText(payload.negativePrompt, 300),
    logoPosition: sanitizeText(payload.logoPosition, 40) || "auto",
    logoUrl: sanitizeText(payload.logoUrl, 2048),
    referenceImageUrl: sanitizeText(payload.referenceImageUrl, 2048),
  };

  if (!normalized.title) {
    throw createApiError(400, "VALIDATION_ERROR", "标题不能为空。", {
      field: "title",
    });
  }

  return normalized;
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
  getForwardedHeaderValue(request, "x-forwarded-proto") || sanitizeText(request.protocol, 20) || "http";

const getPublicRequestHost = (request) =>
  getForwardedHeaderValue(request, "x-forwarded-host") || sanitizeText(request.get?.("host"), 255);

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

const normalizeUploadKind = (requestBody = {}, files = {}) => {
  const explicitKind = sanitizeText(requestBody.kind, 40);

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
  generatePosterImpl = generatePoster,
}) => {
  if (!Router || !multer) {
    throw new Error("createApiRouter 需要传入 Express Router 和 multer。");
  }

  const normalizedApiKey = normalizeEnvValue(apiKey);

  if (!normalizedApiKey) {
    throw new Error("createApiRouter 需要传入 apiKey。");
  }

  ensureUploadDir(uploadDir);
  logDebug("createApiRouter initialized:", {
    uploadDir,
    apiKey: describeEnvValue(normalizedApiKey),
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
      files: 2,
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
    { name: "referenceImage", maxCount: 1 },
  ]);
  const standaloneUpload = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "referenceImage", maxCount: 1 },
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

  router.post("/generate", maybeHandleMultipart, async (request, response, next) => {
    const logoFile = pickFirstFile(request.files, "logo");
    const referenceImageFile = pickFirstFile(request.files, "referenceImage");
    const requestId = getRequestDebugId(request);

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
      validateUploadedFile(referenceImageFile, "referenceImage");

      const logoUrl = request.body?.logoUrl || (logoFile ? buildPublicFileUrl(request, logoFile) : "");
      const referenceImageUrl =
        request.body?.referenceImageUrl || (referenceImageFile ? buildPublicFileUrl(request, referenceImageFile) : "");
      const normalizedPayload = validateGeneratePayload({
        ...request.body,
        logoUrl,
        referenceImageUrl,
      });
      const referenceImages = [normalizedPayload.referenceImageUrl, normalizedPayload.logoUrl].filter(Boolean);
      const promptResult = buildPrompt(normalizedPayload);

      logDebug("prepared prompt and payload for generation:", {
        requestId,
        normalizedPayload,
        publicAssetUrls: {
          logoUrl: normalizedPayload.logoUrl,
          referenceImageUrl: normalizedPayload.referenceImageUrl,
        },
        promptLength: promptResult.prompt.length,
        negativePromptLength: promptResult.negativePrompt.length,
        apiKey: describeEnvValue(normalizedApiKey),
      });

      if ([logoUrl, referenceImageUrl].some((url) => /^http:\/\//i.test(url))) {
        logError("generated public upload URL is using http; upstream image fetch may fail behind Railway proxy:", {
          requestId,
          logoUrl,
          referenceImageUrl,
          protocol: request.protocol,
          forwardedProto: request.get?.("x-forwarded-proto"),
          host: request.get?.("host"),
          forwardedHost: request.get?.("x-forwarded-host"),
        });
      }

      logDebug("calling generatePosterImpl:", {
        requestId,
        apiKey: describeEnvValue(normalizedApiKey),
        referenceImages,
      });
      const generationResult = await generatePosterImpl({
        prompt: promptResult.prompt,
        negativePrompt: promptResult.negativePrompt,
        sizeTemplate: normalizedPayload.sizeTemplate,
        apiKey: normalizedApiKey,
        referenceImages,
        requestId,
      });

      logDebug("generatePosterImpl succeeded:", {
        requestId,
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
          attempts: generationResult.attempts,
          uploads: {
            logoUrl,
            referenceImageUrl,
          },
          metadata: {
            ...promptResult.metadata,
            usedCustomPrompt: promptResult.usedCustomPrompt,
          },
        },
      });
    } catch (error) {
      await Promise.all([safeUnlink(logoFile), safeUnlink(referenceImageFile)]);
      logError("generate route failed:", {
        requestId,
        apiKey: describeEnvValue(normalizedApiKey),
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
          referenceImageFile: referenceImageFile
            ? {
                originalname: referenceImageFile.originalname,
                mimetype: referenceImageFile.mimetype,
                size: referenceImageFile.size,
                filename: referenceImageFile.filename,
                path: referenceImageFile.path,
              }
            : null,
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

      const message =
        typeof error?.message === "string" && error.message.trim()
          ? error.message.trim()
          : "Doubao 图片生成失败，请稍后重试。";

      next(
        createApiError(
          /未配置/.test(message) ? 503 : 502,
          /未配置/.test(message) ? "DOUBAO_NOT_CONFIGURED" : "DOUBAO_GENERATION_FAILED",
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
