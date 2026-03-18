const DEFAULT_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_MODEL = "doubao-seedream-4-0-250828";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_IMAGE_MIME_TYPE = "image/png";

const SIZE_TEMPLATES = {
  mobile: [1080, 1920],
  a4: [2480, 3508],
  wechat_cover: [900, 383],
  wechat_sub: [900, 500],
  weibo: [1000, 1000],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeModel = (value) => {
  const trimmed = String(value || "").trim();

  if (!trimmed || trimmed === "doubao-seed-2.0") {
    return DEFAULT_MODEL;
  }

  return trimmed;
};

const clampImageSize = (width, height, maxSide = 1792) => {
  const longestSide = Math.max(width, height);
  const scale = longestSide > maxSide ? maxSide / longestSide : 1;
  const normalizedWidth = Math.max(512, Math.round((width * scale) / 32) * 32);
  const normalizedHeight = Math.max(512, Math.round((height * scale) / 32) * 32);

  return `${normalizedWidth}x${normalizedHeight}`;
};

export const resolveImageSize = (sizeTemplate = "mobile") => {
  const preset = SIZE_TEMPLATES[String(sizeTemplate || "").trim()] || SIZE_TEMPLATES.mobile;
  return clampImageSize(preset[0], preset[1]);
};

const readMessageContent = (content) => {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item?.type === "text") {
        return item.text || "";
      }

      if (item?.type === "image_url") {
        return item.image_url?.url || "";
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const maybeParseJson = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const buildGenerationPrompt = ({ prompt, negativePrompt = "" }) =>
  negativePrompt ? `${prompt}\n\n负面约束：${negativePrompt}` : prompt;

export const createDoubaoRequestBody = ({
  prompt,
  negativePrompt = "",
  model = DEFAULT_MODEL,
  sizeTemplate = "mobile",
  responseFormat = "b64_json",
}) => ({
  model: normalizeModel(model),
  prompt: buildGenerationPrompt({ prompt, negativePrompt }),
  response_format: responseFormat,
  size: resolveImageSize(sizeTemplate),
  watermark: false,
});

const toDataUrl = (base64Value, mimeType = DEFAULT_IMAGE_MIME_TYPE) => {
  const normalizedValue = String(base64Value || "")
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")
    .replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  return `data:${mimeType};base64,${normalizedValue}`;
};

export const extractImageUrlFromResponse = (payload) => {
  const firstDataItem = payload?.data?.[0];
  const firstOutputItem = payload?.output?.data?.[0] || payload?.output?.images?.[0];
  const mimeType =
    firstDataItem?.mime_type ||
    firstOutputItem?.mime_type ||
    payload?.mime_type ||
    DEFAULT_IMAGE_MIME_TYPE;

  const directCandidates = [
    payload?.imageUrl,
    firstDataItem?.url,
    firstOutputItem?.url,
    payload?.output?.image?.url,
    payload?.result?.image_url,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const base64Candidates = [
    firstDataItem?.b64_json,
    firstOutputItem?.b64_json,
    payload?.b64_json,
    payload?.result?.b64_json,
  ];

  for (const candidate of base64Candidates) {
    const imageUrl = toDataUrl(candidate, mimeType);

    if (imageUrl) {
      return imageUrl;
    }
  }

  const content = readMessageContent(payload?.choices?.[0]?.message?.content);
  const parsed = maybeParseJson(content);

  if (parsed?.imageUrl) {
    return String(parsed.imageUrl).trim();
  }

  if (parsed?.b64_json) {
    return toDataUrl(parsed.b64_json, parsed?.mime_type || mimeType);
  }

  const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/i);

  if (urlMatch) {
    return urlMatch[0];
  }

  const base64Match = content.match(/(?:^|["'\s:])([A-Za-z0-9+/]{128,}={0,2})(?:["'\s,}]|$)/);
  return base64Match ? toDataUrl(base64Match[1], mimeType) : "";
};

export const generatePoster = async ({
  prompt,
  negativePrompt = "",
  apiKey = process.env.DOUBAO_API_KEY,
  endpoint = process.env.DOUBAO_API_ENDPOINT || DEFAULT_ENDPOINT,
  model = process.env.DOUBAO_MODEL || DEFAULT_MODEL,
  sizeTemplate = "mobile",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
}) => {
  if (!prompt) {
    throw new Error("Prompt 不能为空。");
  }

  if (!apiKey) {
    throw new Error("DOUBAO_API_KEY 未配置，无法调用 Doubao 图片生成 API。");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("当前运行环境不支持 fetch。");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          createDoubaoRequestBody({
            prompt,
            negativePrompt,
            model,
            sizeTemplate,
          }),
        ),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Doubao API 请求失败（${response.status}）：${errorBody || "无响应内容"}`);
      }

      const payload = await response.json();
      const imageUrl = extractImageUrlFromResponse(payload);

      if (!imageUrl) {
        throw new Error("Doubao API 响应中未包含图像 URL。");
      }

      return {
        imageUrl,
        provider: "doubao-seed",
        attempts: attempt,
        rawResponse: payload,
      };
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        await sleepImpl(300 * attempt);
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Doubao API 调用失败。");
};
