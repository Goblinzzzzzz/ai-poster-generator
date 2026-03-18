import { buildPosterDataUrl } from "./local-poster.js";

const DEFAULT_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const DEFAULT_MODEL = "doubao-seed-2.0";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const createDoubaoRequestBody = ({ prompt, negativePrompt = "", model = DEFAULT_MODEL }) => ({
  model,
  max_tokens: 2048,
  temperature: 0.6,
  messages: [
    {
      role: "system",
      content:
        "你是一个海报生成助手。请完成图像生成并只返回 JSON，格式为 {\"imageUrl\":\"https://...\"}。",
    },
    {
      role: "user",
      content: negativePrompt ? `${prompt}\n\n补充负面约束：${negativePrompt}` : prompt,
    },
  ],
});

export const extractImageUrlFromResponse = (payload) => {
  const directCandidates = [
    payload?.imageUrl,
    payload?.data?.[0]?.url,
    payload?.output?.image?.url,
    payload?.result?.image_url,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const content = readMessageContent(payload?.choices?.[0]?.message?.content);
  const parsed = maybeParseJson(content);

  if (parsed?.imageUrl) {
    return String(parsed.imageUrl).trim();
  }

  const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/i);
  return urlMatch ? urlMatch[0] : "";
};

export const generatePoster = async ({
  prompt,
  negativePrompt = "",
  apiKey = process.env.DOUBAO_API_KEY,
  endpoint = process.env.DOUBAO_API_ENDPOINT || DEFAULT_ENDPOINT,
  model = process.env.DOUBAO_MODEL || DEFAULT_MODEL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
  fallbackInput = {},
}) => {
  if (!prompt) {
    throw new Error("Prompt 不能为空。");
  }

  if (!apiKey) {
    return {
      imageUrl: buildPosterDataUrl(fallbackInput),
      provider: "local-fallback",
      attempts: 0,
    };
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
        body: JSON.stringify(createDoubaoRequestBody({ prompt, negativePrompt, model })),
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
