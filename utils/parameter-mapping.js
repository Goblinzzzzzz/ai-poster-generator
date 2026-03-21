const ASPECT_RATIO_PRESETS = {
  mobile: {
    value: "mobile",
    label: "9:16",
    template: "mobile",
    aliases: ["mobile", "9:16", "9 / 16", "9x16", "portrait_9_16"],
    sizes: {
      standard: "960x1696",
      high: "1024x1792",
    },
    compositionHint: "竖版构图，强化主体纵深与上下留白",
    layoutHint: "适合移动端海报与封面传播",
  },
  wechat_cover: {
    value: "wechat_cover",
    label: "16:9",
    template: "wechat_cover",
    aliases: ["wechat_cover", "16:9", "16 / 9", "16x9", "landscape_16_9"],
    sizes: {
      standard: "1536x864",
      high: "1792x1024",
    },
    compositionHint: "横向展开画面，保留左右叙事空间",
    layoutHint: "适合横版封面与场景延展",
  },
  weibo: {
    value: "weibo",
    label: "1:1",
    template: "weibo",
    aliases: ["weibo", "1:1", "1 / 1", "1x1", "square_1_1"],
    sizes: {
      standard: "1024x1024",
      high: "1408x1408",
    },
    compositionHint: "中心构图，保持画面重心稳定",
    layoutHint: "适合方形封面与单主体视觉",
  },
  a4: {
    value: "a4",
    label: "3:4",
    template: "a4",
    aliases: ["a4", "3:4", "3 / 4", "3x4", "print_3_4"],
    sizes: {
      standard: "1152x1536",
      high: "1344x1792",
    },
    compositionHint: "纵向版式稳定，适合留白和排版",
    layoutHint: "适合打印海报和信息层次展开",
  },
  wechat_sub: {
    value: "wechat_sub",
    label: "9:5",
    template: "wechat_sub",
    aliases: ["wechat_sub", "9:5", "9 / 5", "9x5"],
    sizes: {
      standard: "1344x768",
      high: "1600x896",
    },
    compositionHint: "横版次图构图，主体集中但保留边缘呼吸区",
    layoutHint: "适合横版次图和摘要视觉",
  },
};

const CLARITY_PRESETS = {
  auto: {
    value: "auto",
    label: "自动",
    basePromptBoosts: ["主体清晰", "画面层次自然"],
    baseNegativeBoosts: ["明显模糊", "脏污画面"],
  },
  standard: {
    value: "standard",
    label: "标准",
    promptBoosts: ["主体清晰", "画面干净", "结构稳定"],
    negativeBoosts: ["低清晰度", "模糊", "结构混乱"],
  },
  high: {
    value: "high",
    label: "高清",
    promptBoosts: ["高细节表现", "材质纹理清晰", "边缘锐利干净", "质感真实"],
    negativeBoosts: ["低清晰度", "模糊", "噪点", "压缩痕迹", "锯齿边缘", "细节涂抹"],
  },
};

const AUTO_HIGH_POSTER_TYPES = new Set(["brand", "festival", "culture"]);
const DEFAULT_ASPECT_RATIO = "mobile";
const DEFAULT_CLARITY = "auto";
const DEFAULT_AUTO_ENHANCE = true;

const normalizeToken = (value) => String(value || "").trim().toLowerCase();

const dedupeList = (values = []) => Array.from(new Set(values.filter(Boolean)));

const findAspectRatioPreset = (value) => {
  const normalizedValue = normalizeToken(value);

  if (!normalizedValue) {
    return null;
  }

  return Object.values(ASPECT_RATIO_PRESETS).find((preset) =>
    preset.aliases.some((alias) => normalizeToken(alias) === normalizedValue),
  );
};

const resolveRequestedClarity = (value) => {
  const normalizedValue = normalizeToken(value);

  if (normalizedValue === "high" || normalizedValue === "hd") {
    return "high";
  }

  if (normalizedValue === "standard") {
    return "standard";
  }

  return DEFAULT_CLARITY;
};

const resolveBooleanValue = (value, fallbackValue = DEFAULT_AUTO_ENHANCE) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return fallbackValue;
  }

  const normalizedValue = normalizeToken(value);

  if (["true", "1", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallbackValue;
};

export const getSupportedAspectRatioValues = () => Object.keys(ASPECT_RATIO_PRESETS);

export const getSupportedClarityValues = () => ["auto", "standard", "high"];

export const resolveAspectRatioMapping = ({ aspectRatio, sizeTemplate } = {}) => {
  const resolvedPreset =
    findAspectRatioPreset(aspectRatio) || findAspectRatioPreset(sizeTemplate) || ASPECT_RATIO_PRESETS[DEFAULT_ASPECT_RATIO];

  return {
    ...resolvedPreset,
    sizeTemplate: resolvedPreset.template,
  };
};

export const resolveClarityMapping = ({
  clarity,
  posterType = "training",
  autoEnhance = DEFAULT_AUTO_ENHANCE,
  hasReferenceImage = false,
} = {}) => {
  const requested = resolveRequestedClarity(clarity);
  const shouldUseHighForAuto =
    AUTO_HIGH_POSTER_TYPES.has(normalizeToken(posterType)) || hasReferenceImage || autoEnhance;
  const effective = requested === "auto" ? (shouldUseHighForAuto ? "high" : "standard") : requested;
  const preset = CLARITY_PRESETS[requested];
  const effectivePreset = CLARITY_PRESETS[effective];

  return {
    requested,
    effective,
    label: preset.label,
    promptBoosts: dedupeList([...(preset.basePromptBoosts || []), ...(effectivePreset.promptBoosts || [])]),
    negativeBoosts: dedupeList([...(preset.baseNegativeBoosts || []), ...(effectivePreset.negativeBoosts || [])]),
  };
};

export const resolveParameterMapping = ({
  aspectRatio,
  sizeTemplate,
  clarity,
  autoEnhance = DEFAULT_AUTO_ENHANCE,
  posterType = "training",
  hasReferenceImage = false,
} = {}) => {
  const aspectRatioMapping = resolveAspectRatioMapping({ aspectRatio, sizeTemplate });
  const autoEnhanceEnabled = resolveBooleanValue(autoEnhance, DEFAULT_AUTO_ENHANCE);
  const clarityMapping = resolveClarityMapping({
    clarity,
    posterType,
    autoEnhance: autoEnhanceEnabled,
    hasReferenceImage,
  });
  const providerSize = aspectRatioMapping.sizes[clarityMapping.effective] || aspectRatioMapping.sizes.standard;

  return {
    aspectRatio: {
      value: aspectRatioMapping.value,
      label: aspectRatioMapping.label,
      sizeTemplate: aspectRatioMapping.sizeTemplate,
      size: providerSize,
      compositionHint: aspectRatioMapping.compositionHint,
      layoutHint: aspectRatioMapping.layoutHint,
    },
    clarity: clarityMapping,
    autoEnhance: autoEnhanceEnabled,
    providerRequest: {
      sizeTemplate: aspectRatioMapping.sizeTemplate,
      size: providerSize,
    },
    promptDirectives: {
      compositionHint: aspectRatioMapping.compositionHint,
      layoutHint: aspectRatioMapping.layoutHint,
      detailBoosts: clarityMapping.promptBoosts,
      negativeBoosts: clarityMapping.negativeBoosts,
    },
    effectiveProfile: {
      aspectRatio: aspectRatioMapping.label,
      aspectRatioValue: aspectRatioMapping.value,
      sizeTemplate: aspectRatioMapping.sizeTemplate,
      size: providerSize,
      requestedClarity: clarityMapping.requested,
      effectiveClarity: clarityMapping.effective,
      autoEnhance: autoEnhanceEnabled,
    },
  };
};

export const isSupportedAspectRatio = (value) => Boolean(findAspectRatioPreset(value));

export const isSupportedClarity = (value) => ["auto", "standard", "high", "hd"].includes(normalizeToken(value));

export const normalizeAutoEnhance = (value, fallbackValue = DEFAULT_AUTO_ENHANCE) =>
  resolveBooleanValue(value, fallbackValue);
