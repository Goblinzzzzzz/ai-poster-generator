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

## Railway

The repository includes `railway.json`, `Procfile`, and `.env.example`. Railway will install dependencies, build the Vite app, and run `server.js`.

Set backend variables in Railway exactly as named below. They are case-sensitive:

- `DOUBAO_API_KEY`
- `DOUBAO_MODEL` (optional)
- `DOUBAO_API_ENDPOINT` (optional)
- `GENERATE_RATE_LIMIT_WINDOW_MS` (optional)
- `GENERATE_RATE_LIMIT_MAX_REQUESTS` (optional)
- `CORS_ORIGIN` (optional)
- `UPLOAD_DIR` (optional)

`VITE_POSTER_API_URL` must point to your app backend `/api/generate` endpoint. The frontend does not call Doubao directly and does not replace `DOUBAO_API_KEY`.
