const normalizeString = (value, fallbackValue = "") => {
  if (typeof value !== "string") {
    return fallbackValue;
  }

  return value.trim();
};

const normalizeStringArray = (value) =>
  Array.from(new Set((Array.isArray(value) ? value : [value]).map((item) => normalizeString(item)).filter(Boolean)));

export const GENERATION_MODES = ["image", "video", "agent"];

export const createIntent = (partial = {}) => ({
  rawPrompt: normalizeString(partial.rawPrompt),
  title: normalizeString(partial.title),
  subtitle: normalizeString(partial.subtitle),
  styleHint: normalizeString(partial.styleHint),
  posterType: normalizeString(partial.posterType) || "training",
  mode: GENERATION_MODES.includes(partial.mode) ? partial.mode : "image",
  referenceImageUrl: normalizeString(partial.referenceImageUrl),
  preferences: partial.preferences || {},
  summary: {
    subject: normalizeString(partial.summary?.subject),
    subjectType: normalizeString(partial.summary?.subjectType),
    scene: normalizeString(partial.summary?.scene),
    mood: normalizeString(partial.summary?.mood),
    explicitStyle: normalizeString(partial.summary?.explicitStyle),
    explicitComposition: normalizeString(partial.summary?.explicitComposition),
    explicitLighting: normalizeString(partial.summary?.explicitLighting),
    explicitMaterial: normalizeString(partial.summary?.explicitMaterial),
    colorHints: normalizeStringArray(partial.summary?.colorHints),
  },
});

export const createPromptSpec = (partial = {}) => ({
  rawPrompt: normalizeString(partial.rawPrompt),
  title: normalizeString(partial.title),
  subject: normalizeString(partial.subject),
  subjectType: normalizeString(partial.subjectType),
  scene: normalizeString(partial.scene),
  style: normalizeString(partial.style),
  composition: normalizeString(partial.composition),
  camera: normalizeString(partial.camera),
  lighting: normalizeString(partial.lighting),
  material: normalizeString(partial.material),
  color: normalizeString(partial.color),
  quality: normalizeStringArray(partial.quality),
  negativePrompt: normalizeStringArray(partial.negativePrompt),
  promptSegments: normalizeStringArray(partial.promptSegments),
  metadata: {
    posterType: normalizeString(partial.metadata?.posterType) || "training",
    mode: GENERATION_MODES.includes(partial.metadata?.mode) ? partial.metadata.mode : "image",
    usedCustomPrompt: Boolean(partial.metadata?.usedCustomPrompt),
    autoEnhance: Boolean(partial.metadata?.autoEnhance),
    hasReferenceImage: Boolean(partial.metadata?.hasReferenceImage),
    aspectRatio: normalizeString(partial.metadata?.aspectRatio),
    effectiveClarity: normalizeString(partial.metadata?.effectiveClarity),
  },
});

export const createProviderRequest = (partial = {}) => ({
  provider: normalizeString(partial.provider) || "doubao-seed",
  prompt: normalizeString(partial.prompt),
  negativePrompt: normalizeString(partial.negativePrompt),
  sizeTemplate: normalizeString(partial.sizeTemplate) || "mobile",
  size: normalizeString(partial.size),
  referenceImages: normalizeStringArray(partial.referenceImages),
  metadata: partial.metadata || {},
});
