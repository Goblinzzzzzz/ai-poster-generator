import { resolveAspectRatioMapping, resolveParameterMapping, normalizeAutoEnhance } from "./parameter-mapping.js";
import { buildPromptSpec } from "./prompt-engine/build-prompt-spec.js";
import { renderFinalPrompt } from "./prompt-engine/render-final-prompt.js";
import { filterSensitivePayload, normalizeInputText } from "./sensitive-filter.js";

const POSTER_TYPE_LABELS = {
  training: "培训",
  culture: "文化",
  brand: "品牌",
  festival: "节日",
  notice: "通知",
};

const SIZE_TEMPLATES = {
  mobile: "竖版手机海报",
  a4: "竖版打印海报",
  wechat_cover: "横版封面",
  wechat_sub: "横版次图",
  weibo: "正方形海报",
};

const LOGO_POSITIONS = {
  auto: "合适位置",
  top_left: "左上角",
  top_right: "右上角",
  bottom_left: "左下角",
  bottom_right: "右下角",
};

const DEFAULT_NEGATIVE_PROMPT = "文字、数字、水印、签名、尺寸标注、低清晰度、模糊、杂乱、错误结构";
const FILTER_FIELDS = ["title", "subtitle", "styleDesc", "customPrompt", "negativePrompt"];

const pickFields = (source = {}, fields = []) =>
  fields.reduce((result, fieldName) => {
    result[fieldName] = source[fieldName];
    return result;
  }, {});

const normalizeOptionalString = (value, maxLength) =>
  typeof value === "string" ? normalizeInputText(value, maxLength) : "";

const sanitizePromptFields = (input = {}) => {
  const { sanitized } = filterSensitivePayload(input, { fields: FILTER_FIELDS });
  return {
    ...input,
    ...pickFields(sanitized, FILTER_FIELDS),
  };
};

export const normalizePromptInput = (input = {}) => {
  const normalizedAspectRatio = normalizeOptionalString(input.aspectRatio, 40) || normalizeOptionalString(input.sizeTemplate, 40) || "mobile";
  const aspectRatioMapping = resolveAspectRatioMapping({
    aspectRatio: normalizedAspectRatio,
    sizeTemplate: normalizeOptionalString(input.sizeTemplate, 40),
  });

  return {
    posterType: normalizeOptionalString(input.posterType, 40) || "training",
    sizeTemplate: aspectRatioMapping.sizeTemplate,
    aspectRatio: aspectRatioMapping.value,
    title: normalizeOptionalString(input.title, 50),
    subtitle: normalizeOptionalString(input.subtitle, 200),
    styleDesc: normalizeOptionalString(input.styleDesc, 120),
    customPrompt: normalizeOptionalString(input.customPrompt, 1000),
    negativePrompt: normalizeOptionalString(input.negativePrompt, 300),
    logoPosition: normalizeOptionalString(input.logoPosition, 40) || "auto",
    logoUrl: normalizeOptionalString(input.logoUrl, 2048),
    referenceImageUrl: normalizeOptionalString(input.referenceImageUrl, 2048),
    clarity: normalizeOptionalString(input.clarity, 40) || "auto",
    autoEnhance: normalizeAutoEnhance(input.autoEnhance, true),
    mode: normalizeOptionalString(input.mode, 40) || "image",
  };
};

export const buildPrompt = (rawInput = {}) => {
  const normalizedInput = normalizePromptInput(rawInput);
  const input = sanitizePromptFields(normalizedInput);
  const { promptSpec, parameterMapping } = buildPromptSpec(input);
  const renderedPrompt = renderFinalPrompt(promptSpec);
  const posterTypeLabel = POSTER_TYPE_LABELS[input.posterType] || "通用";
  const sizeTemplate = SIZE_TEMPLATES[parameterMapping.providerRequest.sizeTemplate] || "通用";
  const logoPositionLabel = LOGO_POSITIONS[input.logoPosition] || "合适位置";
  const hasLogoAsset = Boolean(input.logoUrl);
  const hasReferenceAsset = Boolean(input.referenceImageUrl);
  const prompt = renderedPrompt.prompt || input.customPrompt || input.title || `${posterTypeLabel}视觉海报`;
  const negativePrompt =
    !parameterMapping.autoEnhance && input.negativePrompt
      ? input.negativePrompt
      : renderedPrompt.negativePrompt || input.negativePrompt || DEFAULT_NEGATIVE_PROMPT;

  return {
    prompt,
    negativePrompt,
    usedCustomPrompt: Boolean(input.customPrompt),
    promptSpec,
    parameterMapping,
    metadata: {
      posterTypeLabel,
      sizeTemplate,
      logoPositionLabel,
      hasLogoAsset,
      hasReferenceAsset,
      aspectRatioLabel: parameterMapping.aspectRatio.label,
      aspectRatioValue: parameterMapping.aspectRatio.value,
      requestedClarity: parameterMapping.clarity.requested,
      effectiveClarity: parameterMapping.clarity.effective,
      autoEnhance: parameterMapping.autoEnhance,
      providerSize: parameterMapping.providerRequest.size,
      providerSizeTemplate: parameterMapping.providerRequest.sizeTemplate,
      usedCustomPrompt: Boolean(input.customPrompt),
    },
  };
};
