# AI Poster Generator

React 18 + Vite frontend with an Express backend for poster generation, Doubao-Seed integration, file uploads, and Railway deployment.

## Stack

- React 18
- Vite
- Express + Multer + CORS + dotenv
- Doubao Seedream image generation API via `POST /api/v3/images/generations`

## Local development

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npm run start
```

## Environment

Copy `.env.example` to `.env` and set:

- `DOUBAO_API_KEY`: Volcano Engine / Doubao API key
- `DOUBAO_MODEL`: optional image model override, defaults to `doubao-seedream-4-0-250828`
- `DOUBAO_API_ENDPOINT`: optional endpoint override, defaults to `https://ark.cn-beijing.volces.com/api/v3/images/generations`
- `GENERATE_RATE_LIMIT_WINDOW_MS`: optional rate-limit window for `POST /api/generate`, defaults to `60000`
- `GENERATE_RATE_LIMIT_MAX_REQUESTS`: optional per-IP request cap inside the window, defaults to `5`
- `CORS_ORIGIN`: allowed frontend origin
- `UPLOAD_DIR`: temporary upload storage directory
- `VITE_POSTER_API_URL`: frontend backend endpoint, for local development use `http://localhost:3000/api/generate`

## API

- `POST /api/generate`
  Accepts `multipart/form-data` or JSON.
  Fields: `posterType`, `sizeTemplate`, `title`, `subtitle`, `styleDesc`, `customPrompt`, `negativePrompt`, `logoPosition`, `logo`, `referenceImage`.
- `POST /api/upload`
  Accepts `file`, `logo`, or `referenceImage` and returns a public upload URL.
- `GET /api/health`
  Returns backend health plus the provider status (`doubao-seed` or `unconfigured`).

Uploads are served from `/uploads/*` and cleaned up after 24 hours.

## Verification

```bash
node --check server.js
npm test
npm run build
```

## Railway 部署

### 环境变量配置（必须）

在 Railway Dashboard → Variables 中配置以下环境变量：

**必需变量：**
- `DOUBAO_API_KEY` - Volcano Engine / Doubao API 密钥（从火山引擎控制台获取）

**可选变量（有合理默认值）：**
- `DOUBAO_MODEL` - 模型名称，默认 `doubao-seedream-4-0-250828`
- `DOUBAO_API_ENDPOINT` - API 端点，默认 `https://ark.cn-beijing.volces.com/api/v3/images/generations`
- `GENERATE_RATE_LIMIT_WINDOW_MS` - 限流时间窗口（毫秒），默认 `60000`
- `GENERATE_RATE_LIMIT_MAX_REQUESTS` - 限流请求数，默认 `5`
- `CORS_ORIGIN` - 允许的前端域名，默认允许所有
- `UPLOAD_DIR` - 临时文件存储目录，默认 `/tmp/ai-poster-generator-uploads`
- `PORT` - 服务端口，默认 `3000`（Railway 自动管理）

**前端变量（构建时使用）：**
- `VITE_POSTER_API_URL` - 前端调用后端的 URL，生产环境设置为 `https://[你的域名].railway.app/api/generate`
- `VITE_APP_NAME` - 应用名称，默认 `AI Poster Generator`
- `VITE_DEFAULT_STYLE` - 默认风格，默认 `Editorial Neon`

### 部署步骤

1. 连接 GitHub 仓库到 Railway
2. 在 Railway Dashboard → Variables 中添加环境变量
3. Railway 会自动构建和部署
4. 检查健康检查：访问 `https://[你的域名].railway.app/api/health`

### 注意事项

- ✅ **所有 API 配置通过环境变量管理，代码中无硬编码**
- ✅ `DOUBAO_API_KEY` 仅在服务端使用，不会暴露给前端
- ✅ 前端通过 `VITE_POSTER_API_URL` 调用后端，不直接调用 Doubao
- ✅ 健康检查路径为 `/api/health`
