import { Buffer } from "node:buffer";
import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 3000);
const distDir = resolve("dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const posterTypeLabels = {
  event: "活动海报",
  product: "产品发布",
  movie: "电影概念",
  promo: "促销宣传",
};

const posterSizes = {
  "4:5": { width: 1200, height: 1500 },
  "1:1": { width: 1200, height: 1200 },
  "16:9": { width: 1600, height: 900 },
  A3: { width: 1240, height: 1754 },
};

const styleThemes = {
  杂志霓虹: {
    background: "#120f27",
    accent: "#f97316",
    glow: "#8b5cf6",
    panel: "#24153f",
    text: "#f6f1eb",
    muted: "#f7cfae",
  },
  电影极简: {
    background: "#0f1117",
    accent: "#f59e0b",
    glow: "#384152",
    panel: "#1d2430",
    text: "#f3efe5",
    muted: "#d8d1c4",
  },
  节庆粗粝: {
    background: "#2b120a",
    accent: "#ef4444",
    glow: "#f59e0b",
    panel: "#4b1d12",
    text: "#fff3e8",
    muted: "#ffd3b0",
  },
  奢华产品: {
    background: "#161211",
    accent: "#d4a574",
    glow: "#6c4b2f",
    panel: "#241c19",
    text: "#f5ede3",
    muted: "#dbc7b0",
  },
};

const sendFile = (response, filePath) => {
  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
};

const escapeXml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const chunkText = (input, maxCharsPerLine, maxLines) => {
  const sanitized = String(input || "").trim().replace(/\s+/g, " ");

  if (!sanitized) {
    return [];
  }

  if (!sanitized.includes(" ")) {
    const segments = [];
    for (let index = 0; index < sanitized.length && segments.length < maxLines; index += maxCharsPerLine) {
      segments.push(sanitized.slice(index, index + maxCharsPerLine));
    }
    return segments;
  }

  const words = sanitized.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      if (lines.length === maxLines) {
        return lines;
      }
    }

    currentLine = word;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
};

const readJsonBody = async (request) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024) {
      throw new Error("请求体过大，请压缩 logo 图片后重试。");
    }
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
};

const buildPosterSvg = ({ posterType, size, title, subtitle, style, logo }) => {
  const theme = styleThemes[style] || styleThemes["电影极简"];
  const dimensions = posterSizes[size] || posterSizes["4:5"];
  const label = posterTypeLabels[posterType] || "AI 海报";
  const titleLines = chunkText(title, dimensions.width > 1300 ? 14 : 10, 3);
  const subtitleLines = chunkText(subtitle, dimensions.width > 1300 ? 30 : 24, 4);
  const safeLogo = logo ? escapeXml(logo) : "";
  const logoMarkup = safeLogo
    ? `<image href="${safeLogo}" x="${dimensions.width - 220}" y="70" width="120" height="120" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)" />`
    : `<g transform="translate(${dimensions.width - 160} 80)">
        <rect width="72" height="72" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
        <text x="36" y="46" text-anchor="middle" font-size="26" font-weight="700" fill="${theme.text}">AP</text>
      </g>`;

  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<tspan x="90" dy="${index === 0 ? 0 : dimensions.width > 1300 ? 96 : 86}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const subtitleMarkup = subtitleLines
    .map(
      (line, index) =>
        `<tspan x="92" dy="${index === 0 ? 0 : 38}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.accent}" />
          <stop offset="45%" stop-color="${theme.panel}" />
          <stop offset="100%" stop-color="${theme.background}" />
        </linearGradient>
        <radialGradient id="glowTop" cx="18%" cy="16%" r="52%">
          <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowBottom" cx="88%" cy="82%" r="48%">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.32" />
          <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
        </radialGradient>
        <clipPath id="logoClip">
          <rect x="${dimensions.width - 220}" y="70" width="120" height="120" rx="28" />
        </clipPath>
      </defs>

      <rect width="${dimensions.width}" height="${dimensions.height}" rx="44" fill="${theme.background}" />
      <rect x="18" y="18" width="${dimensions.width - 36}" height="${dimensions.height - 36}" rx="36" fill="url(#bg)" />
      <rect x="42" y="42" width="${dimensions.width - 84}" height="${dimensions.height - 84}" rx="30" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <circle cx="${Math.round(dimensions.width * 0.22)}" cy="${Math.round(dimensions.height * 0.18)}" r="${Math.round(dimensions.width * 0.28)}" fill="url(#glowTop)" />
      <circle cx="${Math.round(dimensions.width * 0.86)}" cy="${Math.round(dimensions.height * 0.82)}" r="${Math.round(dimensions.width * 0.24)}" fill="url(#glowBottom)" />

      <text x="90" y="120" font-size="28" letter-spacing="10" fill="${theme.muted}" font-family="Space Grotesk, Arial, sans-serif">${escapeXml(
        label,
      )}</text>
      ${logoMarkup}

      <text x="90" y="${Math.round(dimensions.height * 0.44)}" font-size="${dimensions.width > 1300 ? 110 : 98}" font-weight="700" fill="${theme.text}" font-family="Space Grotesk, Arial, sans-serif">
        ${titleMarkup}
      </text>

      <text x="92" y="${Math.round(dimensions.height * 0.63)}" font-size="34" fill="${theme.text}" fill-opacity="0.92" font-family="Space Grotesk, Arial, sans-serif">
        ${subtitleMarkup}
      </text>

      <g transform="translate(90 ${dimensions.height - 170})">
        <rect width="${dimensions.width - 180}" height="84" rx="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" />
        <text x="34" y="34" font-size="20" letter-spacing="6" fill="${theme.muted}" font-family="Space Grotesk, Arial, sans-serif">STYLE</text>
        <text x="34" y="62" font-size="26" fill="${theme.text}" font-family="Space Grotesk, Arial, sans-serif">${escapeXml(style)}</text>
        <text x="${dimensions.width - 300}" y="34" font-size="20" letter-spacing="6" fill="${theme.muted}" font-family="Space Grotesk, Arial, sans-serif">SIZE</text>
        <text x="${dimensions.width - 300}" y="62" font-size="26" fill="${theme.text}" font-family="Space Grotesk, Arial, sans-serif">${escapeXml(size)}</text>
      </g>
    </svg>
  `.trim();
};

const handleRequest = async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/generate") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "仅支持 POST /api/generate。" });
      return;
    }

    try {
      const payload = await readJsonBody(request);
      const title = String(payload.title || "").trim();
      const subtitle = String(payload.subtitle || "").trim();

      if (!title || !subtitle) {
        sendJson(response, 400, { error: "标题和副标题不能为空。" });
        return;
      }

      const svg = buildPosterSvg({
        posterType: payload.posterType,
        size: payload.size,
        title,
        subtitle,
        style: payload.style,
        logo: payload.logo,
      });

      const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
      sendJson(response, 200, { imageUrl });
      return;
    } catch (error) {
      sendJson(response, 500, { error: error.message || "海报生成失败。" });
      return;
    }
  }

  const path = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = join(distDir, path);

  if (existsSync(filePath) && !filePath.endsWith("/")) {
    sendFile(response, filePath);
    return;
  }

  if (extname(path)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found.");
    return;
  }

  const indexPath = join(distDir, "index.html");
  if (existsSync(indexPath)) {
    sendFile(response, indexPath);
    return;
  }

  response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Build output is missing. Run `npm run build` first.");
};

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  createServer(handleRequest).listen(port, "0.0.0.0", () => {
    console.log(`AI Poster Generator running on port ${port}`);
  });
}

export { buildPosterSvg, handleRequest };
