import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";

import {
  DOUBAO_API_KEY_ENV_NAMES,
  describeEnvValue,
  getEnvironmentVariableDiagnostics,
  resolveDoubaoApiKey,
} from "./utils/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envFilePath = resolve(__dirname, ".env");
const dotenvResult = dotenv.config({ path: envFilePath });
const { ApiError, cleanupStaleUploads, createApiRouter } = await import("./api/generate.js");
const distDir = resolve(__dirname, "dist");
const uploadDir = resolve(process.env.UPLOAD_DIR || join(tmpdir(), "ai-poster-generator-uploads"));
const port = Number(process.env.PORT || 3000);
const getDoubaoApiKeyResolution = () => resolveDoubaoApiKey();
const getDoubaoApiKey = () => getDoubaoApiKeyResolution().value;

const createRequestDebugId = () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getDotenvStatus = () => {
  if (!dotenvResult?.error) {
    return "loaded";
  }

  return dotenvResult.error.code === "ENOENT" ? "not-found" : "error";
};

const getStartupEnvDiagnostics = () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  uploadDir,
  envFilePath,
  dotenvStatus: getDotenvStatus(),
  dotenvKeys: Object.keys(dotenvResult?.parsed || {}),
  dotenvError:
    dotenvResult?.error
      ? {
          name: dotenvResult.error.name,
          message: dotenvResult.error.message,
          code: dotenvResult.error.code,
        }
      : null,
  localDotenvConfigCallCount: 1,
  hasDoubaoApiKey: Boolean(getDoubaoApiKey()),
  doubaoApiKeyResolution: getDoubaoApiKeyResolution(),
  doubaoApiKeyCandidates: getEnvironmentVariableDiagnostics(DOUBAO_API_KEY_ENV_NAMES),
  doubaoModel: process.env.DOUBAO_MODEL || "(default)",
  doubaoApiEndpoint: process.env.DOUBAO_API_ENDPOINT || "(default)",
  corsOrigin: process.env.CORS_ORIGIN || "(allow-all)",
  railwayEnvironmentVariables: getEnvironmentVariableDiagnostics(
    Object.keys(process.env)
      .filter((key) => key.startsWith("RAILWAY_"))
      .sort(),
  ),
});

const getSortedEnvironmentVariables = () =>
  Object.fromEntries(Object.keys(process.env).sort().map((key) => [key, process.env[key]]));

const normalizeCorsOrigin = () => {
  if (!process.env.CORS_ORIGIN) {
    return true;
  }

  return process.env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const createApp = () => {
  const app = express();
  const routerApiKeyAtMount = getDoubaoApiKey();

  console.log("[server.js] createApp started:", {
    startupEnvDiagnostics: getStartupEnvDiagnostics(),
  });

  console.log("[server.js] createApp router configuration:", {
    uploadDir,
    apiKey: describeEnvValue(routerApiKeyAtMount),
  });

  app.use(
    cors({
      origin: normalizeCorsOrigin(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use((request, response, next) => {
    const requestId = String(request.get("x-request-id") || createRequestDebugId());
    request.posterRequestId = requestId;
    response.setHeader("x-request-id", requestId);

    if (request.path.startsWith("/api")) {
      console.log("[server.js] incoming API request:", {
        requestId,
        method: request.method,
        path: request.originalUrl || request.url,
        apiKeyResolution: getDoubaoApiKeyResolution(),
      });
    }

    next();
  });

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      success: true,
      data: {
        status: "ok",
        uploadDir,
        provider: getDoubaoApiKey() ? "doubao-seed" : "unconfigured",
      },
    });
  });

  app.get("/api/debug-env", (request, response) => {
    const requestId = String(request.posterRequestId || "no-request-id");
    const payload = {
      success: true,
      data: {
        requestId,
        startup: getStartupEnvDiagnostics(),
        doubaoApiKeyResolution: getDoubaoApiKeyResolution(),
        doubaoApiKeyCandidates: getEnvironmentVariableDiagnostics(DOUBAO_API_KEY_ENV_NAMES),
        allEnvironmentVariables: getSortedEnvironmentVariables(),
      },
    };

    console.log("[server.js] /api/debug-env response payload:", payload);
    response.status(200).json(payload);
  });

  app.use("/uploads", express.static(uploadDir, { fallthrough: false, maxAge: "24h" }));
  app.use(
    "/api",
    createApiRouter({
      Router: express.Router,
      multer,
      uploadDir,
      apiKey: routerApiKeyAtMount,
    }),
  );

  app.use(express.static(distDir, { extensions: ["html"] }));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next(createApiError(404, "NOT_FOUND", "接口不存在。"));
      return;
    }

    response.sendFile(join(distDir, "index.html"), (error) => {
      if (!error) {
        return;
      }

      response.status(503).type("text/plain").send("Build output is missing. Run `npm run build` first.");
    });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof multer.MulterError) {
      const payload = {
        success: false,
        error: {
          code: error.code,
          message:
            error.code === "LIMIT_FILE_SIZE" ? "上传文件过大，Logo 最大 5MB，参考图最大 10MB。" : error.message,
        },
      };
      response.status(400).json(payload);
      return;
    }

    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const code = error instanceof ApiError ? error.code : "INTERNAL_ERROR";
    const message = error instanceof ApiError ? error.message : "服务暂时不可用，请稍后重试。";

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details: error instanceof ApiError ? error.details : undefined,
      },
    });
  });

  return app;
};

const createApiError = (statusCode, code, message, details) => new ApiError(statusCode, code, message, details);

const shouldStartServer = process.argv[1] && resolve(process.argv[1]) === __filename;

if (shouldStartServer) {
  const app = createApp();

  console.log("[server.js] dotenv.config result:", {
    envFilePath,
    status: getDotenvStatus(),
    parsedKeys: Object.keys(dotenvResult?.parsed || {}),
    error:
      dotenvResult?.error
        ? {
            name: dotenvResult.error.name,
            message: dotenvResult.error.message,
            code: dotenvResult.error.code,
          }
        : null,
  });
  console.log("[server.js] environment variables on startup:", getSortedEnvironmentVariables());
  console.log("[server.js] startup Doubao API key resolution:", getDoubaoApiKeyResolution());
  console.log("[server.js] startup Doubao API key candidate diagnostics:", getEnvironmentVariableDiagnostics(DOUBAO_API_KEY_ENV_NAMES));
  console.log("[server.js] startup model diagnostics:", describeEnvValue(process.env.DOUBAO_MODEL));
  console.log("[server.js] startup endpoint diagnostics:", describeEnvValue(process.env.DOUBAO_API_ENDPOINT));

  cleanupStaleUploads(uploadDir).catch((error) => {
    console.error("Failed to cleanup stale uploads on startup:", error);
  });

  setInterval(() => {
    cleanupStaleUploads(uploadDir).catch((error) => {
      console.error("Failed to cleanup stale uploads:", error);
    });
  }, 60 * 60 * 1000).unref();

  app.listen(port, "0.0.0.0", () => {
    console.log(`AI Poster Generator API listening on port ${port}`);
    console.log("Startup environment diagnostics:", getStartupEnvDiagnostics());
  });
}

export { getStartupEnvDiagnostics, uploadDir };
