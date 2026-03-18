# AI Poster Generator

A React 18 + Vite + Tailwind CSS v4 starter for an AI-assisted poster generation experience, prepared for Railway deployment.

## Stack

- React 18
- Vite
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Node static server for Railway runtime

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm install
npm run build
npm run start
```

## Railway

The repository includes:

- `railway.json`
- `Procfile`
- `.env.example`

Railway will install dependencies, build the Vite app, and serve the generated `dist` folder through `server.js`.
