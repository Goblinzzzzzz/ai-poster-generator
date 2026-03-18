# AI Poster Generator

React 18 + Vite frontend with an Express backend for poster generation, Doubao-Seed integration, file uploads, and Railway deployment.

## Stack

- React 18
- Vite
- Express + Multer + CORS + dotenv
- Doubao-Seed API with a local SVG fallback when `DOUBAO_API_KEY` is not configured

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
- `CORS_ORIGIN`: allowed frontend origin
- `UPLOAD_DIR`: temporary upload storage directory

## API

- `POST /api/generate`
  Accepts `multipart/form-data` or JSON.
  Fields: `posterType`, `sizeTemplate`, `title`, `subtitle`, `styleDesc`, `customPrompt`, `negativePrompt`, `logoPosition`, `logo`, `referenceImage`.
- `POST /api/upload`
  Accepts `file`, `logo`, or `referenceImage` and returns a public upload URL.
- `GET /api/health`
  Returns backend health plus the active provider mode.

Uploads are served from `/uploads/*` and cleaned up after 24 hours.

## Verification

```bash
node --check server.js
npm test
npm run build
```

## Railway

The repository includes `railway.json`, `Procfile`, and `.env.example`. Railway will install dependencies, build the Vite app, and run `server.js`.
