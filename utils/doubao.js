import {
  DOUBAO_API_KEY_ENV_NAMES,
  describeApiKeyFormat,
  describeEnvValue,
  getEnvironmentVariableDiagnostics,
  normalizeEnvValue,
  resolveDoubaoApiKey,
} from "./env.js";

// 默认端点和模型仅作为 fallback，优先使用环境变量
const DEFAULT_ENDPOINT = process.env.DOUBAO_API_ENDPOINT || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_ENDPOINT_PATH = "/api/v3/images/generations";
const DEFAULT_MODEL = process.env.DOUBAO_MODEL || "doubao-seedream-4-0-250828";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_IMAGE_MIME_TYPE = "image/png";
const MIN_BASE64_IMAGE_LENGTH = 64;
const DATA_URL_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i;
const HTTP_URL_PATTERN = /^https?:\/\//i;
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const DEBUG_SCOPE = "[utils/doubao.js]";

const SIZE_TEMPLATES = {
  mobile: [1080, 1920],
  a4: [2480, 3508],
  wechat_cover: [900, 383],
  wechat_sub: [900, 500],
  weibo: [1000, 1000],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logDebug = (message, details) => {
  console.error(`${DEBUG_SCOPE} ${message}`, details);
};

const logError = (message, details) => {
  console.error(`${DEBUG_SCOPE} ${message}`, details);
};

const getEndpointDiagnostics = (endpoint) => {
  const normalizedEndpoint = String(endpoint || "").trim();

  if (!normalizedEndpoint) {
    return {
      endpoint: normalizedEndpoint,
      isValidUrl: false,
      matchesExpectedPath: false,
      hostname: "",
      pathname: "",
    };
  }

  try {
    const parsedUrl = new URL(normalizedEndpoint);

    return {
      endpoint: normalizedEndpoint,
      isValidUrl: true,
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      matchesExpectedPath: parsedUrl.pathname === DEFAULT_ENDPOINT_PATH,
    };
  } catch (error) {
    return {
      endpoint: normalizedEndpoint,
      isValidUrl: false,
      matchesExpectedPath: false,
      parseError: error.message,
    };
  }
};

const normalizeModel = (value) => {
  const trimmed = String(value || "").trim();

  if (!trimmed || trimmed === "doubao-seed-2.0") {
    return DEFAULT_MODEL;
  }

  return trimmed;
};

const clampImageSize = (width, height, maxSide = 1792) => {
  const longestSide = Math.max(width, height);
  const scale = maxSide / longestSide;
  const normalizedWidth = Math.max(256, Math.round((width * scale) / 32) * 32);
  const normalizedHeight = Math.max(256, Math.round((height * scale) / 32) * 32);

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

const normalizeInputImage = (value) => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (DATA_URL_PATTERN.test(normalized) || HTTP_URL_PATTERN.test(normalized)) {
    return normalized;
  }

  return "";
};

export const createDoubaoRequestBody = ({
  prompt,
  negativePrompt = "",
  model = DEFAULT_MODEL,
  sizeTemplate = "mobile",
  responseFormat = "b64_json",
  referenceImages = [],
}) => {
  const images = Array.from(new Set(referenceImages.map(normalizeInputImage).filter(Boolean))).slice(0, 4);
  const imageField =
    images.length === 0 ? {} : { image: images.length === 1 ? images[0] : images };

  return {
    model: normalizeModel(model),
    prompt: buildGenerationPrompt({ prompt, negativePrompt }),
    response_format: responseFormat,
    size: resolveImageSize(sizeTemplate),
    sequential_image_generation: "disabled",
    stream: false,
    watermark: false,
    ...imageField,
  };
};

const toDataUrl = (base64Value, mimeType = DEFAULT_IMAGE_MIME_TYPE) => {
  const normalizedValue = String(base64Value || "")
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")
    .replace(/^base64,/, "")
    .replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  return `data:${mimeType};base64,${normalizedValue}`;
};

const normalizeOutputImage = (value, mimeType = DEFAULT_IMAGE_MIME_TYPE) => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (DATA_URL_PATTERN.test(normalized) || HTTP_URL_PATTERN.test(normalized)) {
    return normalized;
  }

  const compactValue = normalized.replace(/^base64,/, "").replace(/\s+/g, "");

  if (compactValue.length >= MIN_BASE64_IMAGE_LENGTH && BASE64_IMAGE_PATTERN.test(compactValue)) {
    return toDataUrl(compactValue, mimeType);
  }

  return normalized;
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
    payload?.rawText,
    firstDataItem?.url,
    firstOutputItem?.url,
    payload?.output?.image?.url,
    payload?.result?.image_url,
  ];

  for (const candidate of directCandidates) {
    const normalizedCandidate = normalizeOutputImage(candidate, mimeType);

    if (normalizedCandidate) {
      return normalizedCandidate;
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

const summarizePayloadShape = (payload) => ({
  topLevelKeys: payload && typeof payload === "object" ? Object.keys(payload) : [],
  dataLength: Array.isArray(payload?.data) ? payload.data.length : 0,
  outputKeys: payload?.output && typeof payload.output === "object" ? Object.keys(payload.output) : [],
  resultKeys: payload?.result && typeof payload.result === "object" ? Object.keys(payload.result) : [],
  choiceCount: Array.isArray(payload?.choices) ? payload.choices.length : 0,
});

const maybeParseResponsePayload = async (response) => {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const rawText = await response.text();
  const parsedJson = rawText ? maybeParseJson(rawText) : null;

  return {
    contentType,
    rawText,
    parsedJson,
  };
};

const extractUpstreamErrorMessage = ({ payload, rawText, status }) => {
  const messageCandidates = [
    payload?.error?.message,
    payload?.error?.detail,
    payload?.message,
    payload?.msg,
    payload?.error_msg,
    rawText,
  ];
  const message = messageCandidates.find((value) => typeof value === "string" && value.trim());
  const normalizedMessage = message ? message.trim() : "无响应内容";

  return `Doubao API 请求失败（${status}）：${normalizedMessage}`;
};

export const generatePoster = async ({
  prompt,
  negativePrompt = "",
  referenceImages = [],
  apiKey = resolveDoubaoApiKey().value,
  endpoint = normalizeEnvValue(process.env.DOUBAO_API_ENDPOINT) || DEFAULT_ENDPOINT,
  model = normalizeEnvValue(process.env.DOUBAO_MODEL) || DEFAULT_MODEL,
  sizeTemplate = "mobile",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
  requestId = "no-request-id",
}) => {
  const endpointDiagnostics = getEndpointDiagnostics(endpoint);

  logDebug("generatePoster invoked:", {
    requestId,
    promptLength: String(prompt || "").length,
    negativePromptLength: String(negativePrompt || "").length,
    referenceImages,
    apiKeyFromCaller: describeEnvValue(apiKey),
    apiKeyFromProcessEnvCandidates: getEnvironmentVariableDiagnostics(DOUBAO_API_KEY_ENV_NAMES),
    apiKeyFormatFromCaller: describeApiKeyFormat(apiKey),
    endpoint,
    endpointDiagnostics,
    model,
    sizeTemplate,
    timeoutMs,
    maxRetries,
  });
  apiKey = normalizeEnvValue(apiKey) || resolveDoubaoApiKey().value;

  logDebug("generatePoster normalized configuration:", {
    requestId,
    apiKey: describeEnvValue(apiKey),
    apiKeyFormat: describeApiKeyFormat(apiKey),
    apiKeyResolution: resolveDoubaoApiKey({ explicitValue: apiKey }),
    endpoint,
    endpointDiagnostics,
    model,
    sizeTemplate,
  });

  if (!prompt) {
    logDebug("generatePoster rejected request because prompt was empty:", { requestId });
    throw new Error("Prompt 不能为空。");
  }

  if (!apiKey) {
    logError("generatePoster rejected request because apiKey was empty:", {
      requestId,
      apiKeyFromCaller: describeEnvValue(apiKey),
      apiKeyFromProcessEnvCandidates: getEnvironmentVariableDiagnostics(DOUBAO_API_KEY_ENV_NAMES),
    });
    throw new Error("DOUBAO_API_KEY 未配置，无法调用 Doubao 图片生成 API。");
  }

  if (typeof fetchImpl !== "function") {
    logError("generatePoster rejected request because fetch is unavailable:", { requestId });
    throw new Error("当前运行环境不支持 fetch。");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const requestBody = createDoubaoRequestBody({
        prompt,
        negativePrompt,
        model,
        sizeTemplate,
        referenceImages,
      });

      logDebug("starting Doubao API request attempt:", {
        requestId,
        attempt,
        maxRetries,
        endpoint,
        endpointDiagnostics,
        apiKey: describeEnvValue(apiKey),
        apiKeyFormat: describeApiKeyFormat(apiKey),
        requestBody,
      });
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });
      const durationMs = Date.now() - startedAt;
      const { contentType, rawText, parsedJson } = await maybeParseResponsePayload(response);

      if (!response.ok) {
        logError("Doubao API responded with an error status:", {
          requestId,
          attempt,
          durationMs,
          status: response.status,
          statusText: response.statusText,
          contentType,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          payloadShape: summarizePayloadShape(parsedJson),
          errorBodyPreview: rawText.slice(0, 2_000),
        });
        throw new Error(
          extractUpstreamErrorMessage({
            payload: parsedJson,
            rawText,
            status: response.status,
          }),
        );
      }

      const payload = parsedJson || { rawText };
      const imageUrl = extractImageUrlFromResponse(payload);

      if (!imageUrl) {
        logError("Doubao API response did not include an image URL:", {
          requestId,
          attempt,
          durationMs,
          contentType,
          payloadShape: summarizePayloadShape(parsedJson),
          responseBodyPreview: rawText.slice(0, 2_000),
          payload,
        });
        throw new Error("Doubao API 响应中未包含图像 URL。");
      }

      logDebug("Doubao API request succeeded:", {
        requestId,
        attempt,
        durationMs,
        contentType,
        payloadShape: summarizePayloadShape(parsedJson),
        imageUrlPreview: String(imageUrl).slice(0, 120),
      });

      return {
        imageUrl,
        provider: "doubao-seed",
        attempts: attempt,
        rawResponse: payload,
      };
    } catch (error) {
      lastError = error;
      logError("Doubao API request attempt failed:", {
        requestId,
        attempt,
        endpoint,
        endpointDiagnostics,
        apiKey: describeEnvValue(apiKey),
        apiKeyFormat: describeApiKeyFormat(apiKey),
        errorName: error?.name,
        errorMessage: error?.message,
        stack: error?.stack,
      });

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
