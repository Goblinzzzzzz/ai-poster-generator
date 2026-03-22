import { describeEnvValue, normalizeEnvValue } from "./env.js";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-preview-image-generation";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_IMAGE_MIME_TYPE = "image/png";
const DATA_URL_PATTERN = /^data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i;
const HTTP_URL_PATTERN = /^https?:\/\//i;
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const DEBUG_SCOPE = "[utils/gemini.js]";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logDebug = (message, details) => {
  console.error(`${DEBUG_SCOPE} ${message}`, details);
};

const logError = (message, details) => {
  console.error(`${DEBUG_SCOPE} ${message}`, details);
};

const normalizeModel = (value) => {
  const trimmed = String(value || "").trim();
  return trimmed || DEFAULT_MODEL;
};

const buildEndpoint = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

const summarizePayloadShape = (payload) => {
  if (!payload || typeof payload !== "object") {
    return { kind: typeof payload };
  }

  return {
    topLevelKeys: Object.keys(payload),
    candidateCount: Array.isArray(payload.candidates) ? payload.candidates.length : 0,
    hasPromptFeedback: Boolean(payload.promptFeedback),
  };
};

const normalizeBase64Data = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

const toDataUrl = (data, mimeType = DEFAULT_IMAGE_MIME_TYPE) => {
  const normalizedData = normalizeBase64Data(data);

  if (!normalizedData || !BASE64_IMAGE_PATTERN.test(normalizedData)) {
    return "";
  }

  return `data:${mimeType};base64,${normalizedData}`;
};

const parseDataUrlPart = (value) => {
  const normalizedValue = String(value || "").trim();
  const matched = normalizedValue.match(DATA_URL_PATTERN);

  if (!matched) {
    return null;
  }

  const mimeType = `image/${matched[1]}`;
  const data = normalizeBase64Data(matched[2]);

  if (!data || !BASE64_IMAGE_PATTERN.test(data)) {
    return null;
  }

  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

const buildGenerationPrompt = ({ prompt, negativePrompt = "", referenceImageUrls = [] }) => {
  const normalizedPrompt = String(prompt || "").trim();
  const normalizedNegativePrompt = String(negativePrompt || "").trim();
  const sections = [normalizedPrompt];

  if (normalizedNegativePrompt) {
    sections.push(`避免：${normalizedNegativePrompt}`);
  }

  if (referenceImageUrls.length > 0) {
    sections.push(`参考图链接（可参考构图、色调、材质）：\n${referenceImageUrls.join("\n")}`);
  }

  return sections.filter(Boolean).join("\n\n");
};

export const createGeminiRequestBody = ({ prompt, negativePrompt = "", referenceImages = [] }) => {
  const referenceImageUrls = [];
  const inlineReferenceParts = [];

  for (const referenceImage of referenceImages) {
    const normalizedImage = String(referenceImage || "").trim();

    if (!normalizedImage) {
      continue;
    }

    const parsedDataUrlPart = parseDataUrlPart(normalizedImage);

    if (parsedDataUrlPart) {
      inlineReferenceParts.push(parsedDataUrlPart);
      continue;
    }

    if (HTTP_URL_PATTERN.test(normalizedImage)) {
      referenceImageUrls.push(normalizedImage);
    }
  }

  return {
    contents: [
      {
        role: "user",
        parts: [
          ...inlineReferenceParts,
          {
            text: buildGenerationPrompt({ prompt, negativePrompt, referenceImageUrls }),
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };
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

const maybeParseResponsePayload = async (response) => {
  const contentType = response.headers.get("content-type") || "";
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
    payload?.error?.details,
    payload?.message,
    payload?.promptFeedback?.blockReasonMessage,
    rawText,
  ];
  const message = messageCandidates.find((value) => typeof value === "string" && value.trim());
  const normalizedMessage = message ? message.trim() : "无响应内容";

  return `Gemini API 请求失败（${status}）：${normalizedMessage}`;
};

export const extractImageUrlFromResponse = (payload) => {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const parts = candidates.flatMap((candidate) =>
    Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [],
  );

  for (const part of parts) {
    const inlineData = part?.inlineData || part?.inline_data;
    const mimeType = inlineData?.mimeType || inlineData?.mime_type || DEFAULT_IMAGE_MIME_TYPE;
    const imageData = inlineData?.data;
    const dataUrl = toDataUrl(imageData, mimeType);

    if (dataUrl) {
      return dataUrl;
    }

    const fileData = part?.fileData || part?.file_data;
    const fileUri = String(fileData?.fileUri || fileData?.file_uri || "").trim();

    if (fileUri) {
      return fileUri;
    }
  }

  const textCandidates = parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n");
  const urlMatch = textCandidates.match(/https?:\/\/[^\s)]+/);

  if (urlMatch) {
    return urlMatch[0];
  }

  return "";
};

export const generatePoster = async ({
  prompt,
  negativePrompt = "",
  referenceImages = [],
  apiKey = normalizeEnvValue(process.env.GEMINI_API_KEY),
  model = normalizeEnvValue(process.env.GEMINI_MODEL) || DEFAULT_MODEL,
  endpoint = "",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
  requestId = "no-request-id",
}) => {
  const normalizedModel = normalizeModel(model);
  const normalizedEndpoint = normalizeEnvValue(endpoint) || buildEndpoint(normalizedModel);
  const normalizedApiKey = normalizeEnvValue(apiKey);

  logDebug("generatePoster invoked:", {
    requestId,
    promptLength: String(prompt || "").length,
    negativePromptLength: String(negativePrompt || "").length,
    referenceImagesCount: Array.isArray(referenceImages) ? referenceImages.length : 0,
    model: normalizedModel,
    endpoint: normalizedEndpoint,
    apiKey: describeEnvValue(normalizedApiKey),
    timeoutMs,
    maxRetries,
  });

  if (!prompt) {
    throw new Error("Prompt 不能为空。");
  }

  if (!normalizedApiKey) {
    throw new Error("GEMINI_API_KEY 未配置，无法调用 Gemini 图片生成 API。");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("当前运行环境不支持 fetch。");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const requestBody = createGeminiRequestBody({
        prompt,
        negativePrompt,
        referenceImages,
      });
      const requestUrl = `${normalizedEndpoint}?key=${encodeURIComponent(normalizedApiKey)}`;

      logDebug("starting Gemini API request attempt:", {
        requestId,
        attempt,
        maxRetries,
        requestUrl: requestUrl.slice(0, 120),
        requestBodyShape: {
          contentsCount: requestBody.contents?.length || 0,
          firstPartsCount: requestBody.contents?.[0]?.parts?.length || 0,
        },
      });

      const response = await fetchImpl(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      const durationMs = Date.now() - startedAt;
      const { contentType, rawText, parsedJson } = await maybeParseResponsePayload(response);

      if (!response.ok) {
        logError("Gemini API responded with an error status:", {
          requestId,
          attempt,
          durationMs,
          status: response.status,
          statusText: response.statusText,
          contentType,
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
        throw new Error("Gemini API 响应中未包含可用图像数据。");
      }

      logDebug("Gemini API request succeeded:", {
        requestId,
        attempt,
        durationMs,
        contentType,
        payloadShape: summarizePayloadShape(parsedJson),
        imageUrlPreview: imageUrl.slice(0, 120),
      });

      return {
        imageUrl,
        provider: "gemini",
        attempts: attempt,
        rawResponse: payload,
      };
    } catch (error) {
      lastError = error;

      logError("Gemini API request attempt failed:", {
        requestId,
        attempt,
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

  throw lastError || new Error("Gemini API 调用失败。");
};
