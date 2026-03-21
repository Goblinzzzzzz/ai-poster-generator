import { resolveParameterMapping } from "../parameter-mapping.js";
import { inferIntentDefaults, normalizeIntent } from "./normalize-intent.js";
import { createPromptSpec } from "./schema.js";

const DEFAULT_NEGATIVE_CONSTRAINTS = ["文字", "数字", "水印", "签名", "错误结构", "杂乱背景"];
const SPLIT_PATTERN = /[，,。；;\n]/;

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const dedupeList = (values = []) => Array.from(new Set(values.filter(Boolean)));

const splitList = (value) =>
  normalizeText(value)
    .split(SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);

const joinWithSeparator = (values = [], separator = "，") => dedupeList(values).join(separator);

const resolveFieldValue = ({ explicitValue, defaultValue, autoEnhance }) => {
  if (explicitValue) {
    return explicitValue;
  }

  if (autoEnhance) {
    return defaultValue;
  }

  return "";
};

export const buildPromptSpec = (input = {}) => {
  const usedCustomPrompt = Boolean(normalizeText(input.customPrompt));
  const rawPrompt = normalizeText(input.customPrompt) || normalizeText(input.title);
  const parameterMapping = resolveParameterMapping({
    aspectRatio: input.aspectRatio,
    sizeTemplate: input.sizeTemplate,
    clarity: input.clarity,
    autoEnhance: input.autoEnhance,
    posterType: input.posterType,
    hasReferenceImage: Boolean(input.referenceImageUrl),
  });
  const intent = normalizeIntent({
    rawPrompt,
    title: input.title,
    subtitle: input.subtitle,
    styleHint: input.styleDesc,
    posterType: input.posterType,
    mode: input.mode,
    referenceImageUrl: input.referenceImageUrl,
    preferences: parameterMapping.effectiveProfile,
  });
  const defaults = inferIntentDefaults(intent.summary.subjectType, intent.posterType);
  const autoEnhance = parameterMapping.autoEnhance;
  const explicitStyle = joinWithSeparator([intent.summary.explicitStyle, normalizeText(input.styleDesc)], "，");
  const enrichedStyle = autoEnhance ? joinWithSeparator([explicitStyle, defaults.style], "，") : explicitStyle;
  const compositionDefault = joinWithSeparator(
    [defaults.composition, parameterMapping.promptDirectives.compositionHint],
    "，",
  );
  const referencePrompt =
    autoEnhance && input.referenceImageUrl ? "参考上传图片的配色与氛围" : "";
  const scene = resolveFieldValue({
    explicitValue: intent.summary.scene,
    defaultValue: defaults.scene,
    autoEnhance,
  });
  const style = resolveFieldValue({
    explicitValue: enrichedStyle,
    defaultValue: defaults.style,
    autoEnhance,
  });
  const composition = resolveFieldValue({
    explicitValue: intent.summary.explicitComposition,
    defaultValue: compositionDefault,
    autoEnhance,
  });
  const lighting = resolveFieldValue({
    explicitValue: intent.summary.explicitLighting,
    defaultValue: defaults.lighting,
    autoEnhance,
  });
  const material = resolveFieldValue({
    explicitValue: intent.summary.explicitMaterial,
    defaultValue: defaults.material,
    autoEnhance,
  });
  const color = resolveFieldValue({
    explicitValue: intent.summary.colorHints.join("、"),
    defaultValue: defaults.color,
    autoEnhance,
  });
  const quality = autoEnhance ? parameterMapping.promptDirectives.detailBoosts : [];
  const negativePrompt = dedupeList([
    ...DEFAULT_NEGATIVE_CONSTRAINTS,
    ...splitList(input.negativePrompt),
    ...parameterMapping.promptDirectives.negativeBoosts,
  ]);

  return {
    promptSpec: createPromptSpec({
      rawPrompt,
      title: normalizeText(input.title),
      subject: intent.summary.subject,
      subjectType: intent.summary.subjectType,
      scene,
      style,
      composition,
      camera: autoEnhance ? defaults.camera : "",
      lighting,
      material,
      color,
      quality,
      negativePrompt,
      promptSegments: [
        intent.summary.subject,
        normalizeText(input.subtitle),
        scene,
        style,
        composition,
        autoEnhance ? defaults.camera : "",
        lighting,
        material,
        color,
        referencePrompt,
        ...quality,
      ],
      metadata: {
        posterType: intent.posterType,
        mode: intent.mode,
        usedCustomPrompt,
        autoEnhance,
        hasReferenceImage: Boolean(input.referenceImageUrl),
        aspectRatio: parameterMapping.aspectRatio.label,
        effectiveClarity: parameterMapping.clarity.effective,
      },
    }),
    intent,
    parameterMapping,
  };
};
