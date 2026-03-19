import { filterSensitivePayload, normalizeInputText } from "./sensitive-filter.js";

// 海报类型标签（仅用于内部标识，不写入 prompt）
const POSTER_TYPE_LABELS = {
  training: "培训",
  culture: "文化",
  brand: "品牌",
  festival: "节日",
  notice: "通知",
};

// 尺寸模板（仅用于 API 参数，不写入 prompt）
const SIZE_TEMPLATES = {
  mobile: "竖版手机海报",
  a4: "A4 打印尺寸",
  wechat_cover: "横版封面",
  wechat_sub: "横版次图",
  weibo: "正方形海报",
};

// Logo 位置（仅用于内部标识，不写入 prompt）
const LOGO_POSITIONS = {
  auto: "合适位置",
  top_left: "左上角",
  top_right: "右上角",
  bottom_left: "左下角",
  bottom_right: "右下角",
};

export const normalizePromptInput = (input = {}) => {
  const normalized = {
    posterType: normalizeInputText(input.posterType, 40) || "training",
    sizeTemplate: normalizeInputText(input.sizeTemplate, 40) || "mobile",
    title: normalizeInputText(input.title, 50),
    subtitle: normalizeInputText(input.subtitle, 200),
    styleDesc: normalizeInputText(input.styleDesc, 120) || "简约现代",
    customPrompt: normalizeInputText(input.customPrompt, 1000),
    negativePrompt: normalizeInputText(input.negativePrompt, 300),
    logoPosition: normalizeInputText(input.logoPosition, 40) || "auto",
    logoUrl: normalizeInputText(input.logoUrl, 2048),
    referenceImageUrl: normalizeInputText(input.referenceImageUrl, 2048),
  };

  return filterSensitivePayload(normalized).sanitized;
};

export const buildPrompt = (rawInput = {}) => {
  const input = normalizePromptInput(rawInput);
  const posterTypeLabel = POSTER_TYPE_LABELS[input.posterType] || "通用";
  const sizeTemplate = SIZE_TEMPLATES[input.sizeTemplate] || "通用";
  const logoPositionLabel = LOGO_POSITIONS[input.logoPosition] || "合适位置";
  const hasLogoAsset = Boolean(input.logoUrl);
  const hasReferenceAsset = Boolean(input.referenceImageUrl);

  const themeSentence = input.title ? `主题参考：${input.title}${input.subtitle ? `，${input.subtitle}` : ""}。` : "";
  const logoSentence = hasLogoAsset
    ? `已上传 Logo，请在${logoPositionLabel}自然预留品牌位置。`
    : "未提供 Logo，画面保持完整即可。";
  const referenceSentence = hasReferenceAsset
    ? "已上传参考图，可参考其配色、构图和材质氛围，但不要直接复制。"
    : "";
  const sharedConstraints =
    "画面保持专业、干净、层次清晰，适合商业传播，并为后期中文排版预留空间。图片中不要出现任何文字、数字、水印、签名或尺寸标注。";

  if (input.customPrompt) {
    const customPromptSections = [
      input.customPrompt,
      `请输出适用于${sizeTemplate}的${posterTypeLabel}视觉海报。`,
      `整体风格保持${input.styleDesc}。`,
      themeSentence,
      logoSentence,
      referenceSentence,
      sharedConstraints,
    ].filter(Boolean);

    return {
      prompt: customPromptSections.join(" "),
      negativePrompt: input.negativePrompt,
      usedCustomPrompt: true,
      metadata: {
        posterTypeLabel,
        sizeTemplate,
        logoPositionLabel,
      },
    };
  }

  const promptSections = [
    `请设计一张适用于${sizeTemplate}的${posterTypeLabel}视觉海报。`,
    themeSentence,
    `整体风格：${input.styleDesc}。`,
    "配色保持专业协调，主体明确，构图清晰，留白自然。",
    logoSentence,
    referenceSentence,
    sharedConstraints,
  ].filter(Boolean);

  const defaultNegativePrompt = "文字、数字、水印、签名、尺寸标注、低清晰度、模糊、杂乱、错误结构";
  const combinedNegativePrompt = input.negativePrompt
    ? `${defaultNegativePrompt}, ${input.negativePrompt}`
    : defaultNegativePrompt;

  return {
    prompt: promptSections.join("\n"),
    negativePrompt: combinedNegativePrompt,
    usedCustomPrompt: false,
    metadata: {
      posterTypeLabel,
      sizeTemplate,
      logoPositionLabel,
    },
  };
};
