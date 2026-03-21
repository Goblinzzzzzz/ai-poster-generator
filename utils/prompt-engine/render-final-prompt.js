const dedupeList = (values = []) => Array.from(new Set(values.filter(Boolean)));

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

export const renderFinalPrompt = (promptSpec) => {
  const promptSegments = dedupeList(
    Array.isArray(promptSpec?.promptSegments)
      ? promptSpec.promptSegments.map((item) => normalizeText(item))
      : [],
  );
  const finalPrompt = promptSegments.join("，");
  const negativePrompt = dedupeList(promptSpec?.negativePrompt || []).join("，");

  return {
    prompt: finalPrompt || normalizeText(promptSpec?.rawPrompt),
    negativePrompt,
  };
};
