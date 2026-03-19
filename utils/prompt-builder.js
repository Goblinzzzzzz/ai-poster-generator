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
  a4: "A4 打印尺寸",
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
const AUXILIARY_FILTER_FIELDS = ["title", "subtitle", "styleDesc", "negativePrompt"];

const pickFields = (source = {}, fields = []) =>
  fields.reduce((result, fieldName) => {
    result[fieldName] = source[fieldName];
    return result;
  }, {});

const joinPromptParts = (parts = []) => parts.filter(Boolean).join("，");
const normalizeOptionalString = (value, maxLength) => (typeof value === "string" ? normalizeInputText(value, maxLength) : "");

const sanitizeAuxiliaryFields = (input = {}) => {
  const { sanitized } = filterSensitivePayload(input, { fields: AUXILIARY_FILTER_FIELDS });
  return {
    ...input,
    ...pickFields(sanitized, AUXILIARY_FILTER_FIELDS),
  };
};

export const normalizePromptInput = (input = {}) => ({
  posterType: normalizeOptionalString(input.posterType, 40) || "training",
  sizeTemplate: normalizeOptionalString(input.sizeTemplate, 40) || "mobile",
  title: normalizeOptionalString(input.title, 50),
  subtitle: normalizeOptionalString(input.subtitle, 200),
  styleDesc: normalizeOptionalString(input.styleDesc, 120) || "简约现代",
  customPrompt: normalizeOptionalString(input.customPrompt, 1000),
  negativePrompt: normalizeOptionalString(input.negativePrompt, 300),
  logoPosition: normalizeOptionalString(input.logoPosition, 40) || "auto",
  logoUrl: normalizeOptionalString(input.logoUrl, 2048),
  referenceImageUrl: normalizeOptionalString(input.referenceImageUrl, 2048),
});

export const buildPrompt = (rawInput = {}) => {
  const normalizedInput = normalizePromptInput(rawInput);
  const input = sanitizeAuxiliaryFields(normalizedInput);
  const posterTypeLabel = POSTER_TYPE_LABELS[input.posterType] || "通用";
  const sizeTemplate = SIZE_TEMPLATES[input.sizeTemplate] || "通用";
  const logoPositionLabel = LOGO_POSITIONS[input.logoPosition] || "合适位置";
  const hasLogoAsset = Boolean(input.logoUrl);
  const hasReferenceAsset = Boolean(input.referenceImageUrl);

  if (normalizedInput.customPrompt) {
    return {
      prompt: normalizedInput.customPrompt,
      negativePrompt: input.negativePrompt,
      usedCustomPrompt: true,
      metadata: {
        posterTypeLabel,
        sizeTemplate,
        logoPositionLabel,
        hasLogoAsset,
        hasReferenceAsset,
      },
    };
  }

  const prompt = joinPromptParts([
    input.title || `${posterTypeLabel}视觉海报`,
    input.subtitle,
    input.styleDesc ? `${input.styleDesc}风格` : "",
    `${posterTypeLabel}主题视觉`,
    hasReferenceAsset ? "参考上传图片的配色和氛围" : "",
    hasLogoAsset ? `为 Logo 预留${logoPositionLabel}位置` : "",
  ]);

  return {
    prompt,
    negativePrompt: input.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
    usedCustomPrompt: false,
    metadata: {
      posterTypeLabel,
      sizeTemplate,
      logoPositionLabel,
      hasLogoAsset,
      hasReferenceAsset,
    },
  };
};
