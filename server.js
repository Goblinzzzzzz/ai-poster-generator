import "dotenv/config";

import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import multer from "multer";

import { ApiError, cleanupStaleUploads, createApiRouter } from "./api/generate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, "dist");
const uploadDir = resolve(process.env.UPLOAD_DIR || join(tmpdir(), "ai-poster-generator-uploads"));
const port = Number(process.env.PORT || 3000);

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

  app.use(
    cors({
      origin: normalizeCorsOrigin(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      success: true,
      data: {
        status: "ok",
        uploadDir,
        provider: process.env.DOUBAO_API_KEY ? "doubao-seed" : "local-fallback",
      },
    });
  });

  app.use("/uploads", express.static(uploadDir, { fallthrough: false, maxAge: "24h" }));
  app.use("/api", createApiRouter({ Router: express.Router, multer, uploadDir }));

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

const app = createApp();

const shouldStartServer = process.argv[1] && resolve(process.argv[1]) === __filename;

if (shouldStartServer) {
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
  });
}

export { uploadDir };
