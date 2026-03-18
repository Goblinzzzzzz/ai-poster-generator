const POSTER_TYPE_LABELS = {
  training: "培训海报",
  culture: "文化海报",
  brand: "品牌宣传海报",
  festival: "节日海报",
  notice: "通知海报",
};

const SIZE_LABELS = {
  mobile: "1080×1920（手机海报）",
  a4: "2480×3508（A4 打印）",
  wechat_cover: "900×383（公众号封面）",
  wechat_sub: "900×500（公众号次图）",
  weibo: "1000×1000（微博海报）",
};

const LOGO_POSITION_LABELS = {
  auto: "自动推荐位置",
  top_left: "左上角",
  top_right: "右上角",
  bottom_left: "左下角",
  bottom_right: "右下角",
};

const sanitizeText = (value, maxLength = 1000) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

export const normalizePromptInput = (input = {}) => ({
  posterType: sanitizeText(input.posterType, 40) || "training",
  sizeTemplate: sanitizeText(input.sizeTemplate, 40) || "mobile",
  title: sanitizeText(input.title, 50),
  subtitle: sanitizeText(input.subtitle, 200),
  styleDesc: sanitizeText(input.styleDesc, 120) || "简约现代",
  customPrompt: String(input.customPrompt || "").trim().slice(0, 1000),
  negativePrompt: sanitizeText(input.negativePrompt, 300),
  logoPosition: sanitizeText(input.logoPosition, 40) || "auto",
  logoUrl: sanitizeText(input.logoUrl, 2048),
  referenceImageUrl: sanitizeText(input.referenceImageUrl, 2048),
});

export const buildPrompt = (rawInput = {}) => {
  const input = normalizePromptInput(rawInput);
  const posterTypeLabel = POSTER_TYPE_LABELS[input.posterType] || input.posterType || "海报";
  const sizeLabel = SIZE_LABELS[input.sizeTemplate] || input.sizeTemplate || "自定义尺寸";
  const logoPositionLabel = LOGO_POSITION_LABELS[input.logoPosition] || "自动推荐位置";
  const hasLogoAsset = Boolean(input.logoUrl);
  const hasReferenceAsset = Boolean(input.referenceImageUrl);
  const outputRequirements = [
    "高质量、专业设计",
    `符合${posterTypeLabel}特点`,
    "色彩协调、版式清晰、适合中文排版",
  ];

  const structuredContext = [
    `- 海报类型：${posterTypeLabel}`,
    `- 尺寸：${sizeLabel}`,
    `- 标题：${input.title || "未提供"}`,
    `- 副标题：${input.subtitle || "未提供"}`,
    `- 风格：${input.styleDesc}`,
    `- Logo：${hasLogoAsset ? "已上传品牌 Logo 素材，请保留品牌识别感" : "无 Logo 素材"}`,
    `- Logo 位置：${logoPositionLabel}`,
    `- 参考图：${hasReferenceAsset ? "已上传参考图，请参考其整体配色、构图或质感" : "无参考图"}`,
  ];

  if (input.customPrompt) {
    const customPromptSections = [
      input.customPrompt,
      "",
      "补充约束：",
      ...structuredContext,
      "",
      "输出要求：",
      ...outputRequirements.map((item) => `- ${item}`),
    ];

    if (input.negativePrompt) {
      customPromptSections.push("", `负面要求：${input.negativePrompt}`);
    }

    return {
      prompt: customPromptSections.join("\n"),
      negativePrompt: input.negativePrompt,
      usedCustomPrompt: true,
      metadata: {
        posterTypeLabel,
        sizeLabel,
        logoPositionLabel,
      },
    };
  }

  const promptSections = [
    `请生成一张${posterTypeLabel}，要求：`,
    `- 尺寸：${sizeLabel}`,
    `- 标题：${input.title || "未提供"}`,
    `- 副标题：${input.subtitle || "未提供"}`,
    `- 风格：${input.styleDesc}`,
    `- 包含 Logo：${hasLogoAsset ? `是，位置 ${logoPositionLabel}` : "无"}`,
    `- 参考风格：${hasReferenceAsset ? "已上传参考图，请参考其视觉风格" : "无"}`,
    `- 负面要求：${input.negativePrompt || "无"}`,
    "",
    "输出要求：",
    ...outputRequirements.map((item) => `- ${item}`),
  ];

  return {
    prompt: promptSections.join("\n"),
    negativePrompt: input.negativePrompt,
    usedCustomPrompt: false,
    metadata: {
      posterTypeLabel,
      sizeLabel,
      logoPositionLabel,
    },
  };
};
