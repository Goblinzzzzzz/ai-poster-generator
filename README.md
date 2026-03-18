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
- `CORS_ORIGIN`: allowed frontend origin
- `UPLOAD_DIR`: temporary upload storage directory

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
