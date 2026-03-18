import { Buffer } from "node:buffer";

const posterTypeLabels = {
  training: "培训海报",
  culture: "文化海报",
  brand: "品牌宣传",
  festival: "节日海报",
  notice: "通知海报",
};

const posterSizes = {
  mobile: { label: "1080×1920", width: 1080, height: 1920 },
  a4: { label: "2480×3508", width: 1240, height: 1754 },
  wechat_cover: { label: "900×383", width: 1440, height: 614 },
  wechat_sub: { label: "900×500", width: 1440, height: 800 },
  weibo: { label: "1000×1000", width: 1400, height: 1400 },
};

const styleThemes = {
  专业严谨: {
    background: "#0f172a",
    accent: "#38bdf8",
    glow: "#0ea5e9",
    panel: "#1e293b",
    text: "#f8fafc",
    muted: "#cbd5e1",
  },
  温暖人文: {
    background: "#422006",
    accent: "#fb923c",
    glow: "#fdba74",
    panel: "#7c2d12",
    text: "#fff7ed",
    muted: "#fed7aa",
  },
  高端商务: {
    background: "#111827",
    accent: "#f59e0b",
    glow: "#fcd34d",
    panel: "#1f2937",
    text: "#fffbeb",
    muted: "#fcd34d",
  },
  喜庆热闹: {
    background: "#450a0a",
    accent: "#ef4444",
    glow: "#fb7185",
    panel: "#7f1d1d",
    text: "#fff1f2",
    muted: "#fecdd3",
  },
  清晰醒目: {
    background: "#111827",
    accent: "#22c55e",
    glow: "#4ade80",
    panel: "#1f2937",
    text: "#f9fafb",
    muted: "#bbf7d0",
  },
  default: {
    background: "#111827",
    accent: "#8b5cf6",
    glow: "#a78bfa",
    panel: "#1f2937",
    text: "#f8fafc",
    muted: "#ddd6fe",
  },
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

export const buildPosterSvg = ({
  posterType,
  sizeTemplate,
  title,
  subtitle,
  styleDesc,
  logoUrl,
}) => {
  const theme = styleThemes[styleDesc] || styleThemes.default;
  const size = posterSizes[sizeTemplate] || posterSizes.mobile;
  const label = posterTypeLabels[posterType] || "AI 海报";
  const titleLines = chunkText(title, size.width > 1300 ? 14 : 12, 3);
  const subtitleLines = chunkText(subtitle, size.width > 1300 ? 24 : 20, 4);
  const hasWideRatio = size.width / size.height > 1.6;
  const safeLogo = logoUrl ? escapeXml(logoUrl) : "";
  const posterTitleY = hasWideRatio ? Math.round(size.height * 0.42) : Math.round(size.height * 0.45);
  const posterSubtitleY = hasWideRatio ? Math.round(size.height * 0.66) : Math.round(size.height * 0.62);
  const footerY = size.height - (hasWideRatio ? 96 : 170);
  const logoMarkup = safeLogo
    ? `<image href="${safeLogo}" x="${size.width - 220}" y="70" width="120" height="120" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)" />`
    : `<g transform="translate(${size.width - 160} 80)">
        <rect width="72" height="72" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
        <text x="36" y="46" text-anchor="middle" font-size="26" font-weight="700" fill="${theme.text}">AP</text>
      </g>`;

  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<tspan x="90" dy="${index === 0 ? 0 : hasWideRatio ? 62 : 86}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const subtitleMarkup = subtitleLines
    .map((line, index) => `<tspan x="92" dy="${index === 0 ? 0 : 38}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.accent}" />
          <stop offset="45%" stop-color="${theme.panel}" />
          <stop offset="100%" stop-color="${theme.background}" />
        </linearGradient>
        <radialGradient id="glowTop" cx="18%" cy="16%" r="52%">
          <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.96" />
          <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowBottom" cx="88%" cy="82%" r="48%">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.32" />
          <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
        </radialGradient>
        <clipPath id="logoClip">
          <rect x="${size.width - 220}" y="70" width="120" height="120" rx="28" />
        </clipPath>
      </defs>

      <rect width="${size.width}" height="${size.height}" rx="44" fill="${theme.background}" />
      <rect x="18" y="18" width="${size.width - 36}" height="${size.height - 36}" rx="36" fill="url(#bg)" />
      <rect x="42" y="42" width="${size.width - 84}" height="${size.height - 84}" rx="30" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <circle cx="${Math.round(size.width * 0.22)}" cy="${Math.round(size.height * 0.18)}" r="${Math.round(size.width * 0.28)}" fill="url(#glowTop)" />
      <circle cx="${Math.round(size.width * 0.86)}" cy="${Math.round(size.height * 0.82)}" r="${Math.round(size.width * 0.24)}" fill="url(#glowBottom)" />

      <text x="90" y="120" font-size="28" letter-spacing="10" fill="${theme.muted}" font-family="Space Grotesk, Arial, sans-serif">${escapeXml(
        label,
      )}</text>
      ${logoMarkup}

      <text x="90" y="${posterTitleY}" font-size="${hasWideRatio ? 76 : 98}" font-weight="700" fill="${theme.text}" font-family="Space Grotesk, Arial, sans-serif">
        ${titleMarkup}
      </text>

      <text x="92" y="${posterSubtitleY}" font-size="${hasWideRatio ? 26 : 34}" fill="${theme.text}" fill-opacity="0.92" font-family="Space Grotesk, Arial, sans-serif">
        ${subtitleMarkup}
      </text>

      <g transform="translate(90 ${footerY})">
        <rect width="${size.width - 180}" height="${hasWideRatio ? 64 : 84}" rx="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" />
        <text x="34" y="${hasWideRatio ? 28 : 34}" font-size="${hasWideRatio ? 16 : 20}" letter-spacing="6" fill="${theme.muted}" font-family="Space Grotesk, Arial, sans-serif">STYLE</text>
        <text x="34" y="${hasWideRatio ? 48 : 62}" font-size="${hasWideRatio ? 20 : 26}" fill="${theme.text}" font-family="Space Grotesk, Arial, sans-serif">${escapeXml(
          styleDesc || "默认风格",
        )}</text>
        <text x="${size.width - 300}" y="${hasWideRatio ? 28 : 34}" font-size="${hasWideRatio ? 16 : 20}" letter-spacing="6" fill="${theme.muted}" font-family="Space Grotesk, Arial, sans-serif">SIZE</text>
        <text x="${size.width - 300}" y="${hasWideRatio ? 48 : 62}" font-size="${hasWideRatio ? 20 : 26}" fill="${theme.text}" font-family="Space Grotesk, Arial, sans-serif">${escapeXml(
          size.label,
        )}</text>
      </g>
    </svg>
  `.trim();
};

export const buildPosterDataUrl = (input) =>
  `data:image/svg+xml;base64,${Buffer.from(buildPosterSvg(input)).toString("base64")}`;
