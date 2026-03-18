export const DOUBAO_API_KEY_ENV_NAMES = ["DOUBAO_API_KEY", "DOUBAO_KEY", "API_KEY"];
const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const normalizeEnvValue = (value) => (typeof value === "string" ? value.trim() : value);

const maskSecret = (value) => {
  if (!value) {
    return "(missing)";
  }

  const normalized = String(value).trim();

  if (normalized.length <= 8) {
    return `${normalized.slice(0, 2)}***`;
  }

  return `${normalized.slice(0, 4)}***${normalized.slice(-4)}`;
};

export const describeEnvValue = (value) => {
  const rawValue = value === undefined ? undefined : String(value);
  const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;

  return {
    rawValue,
    normalizedValue,
    hasValue: Boolean(normalizedValue),
    rawLength: typeof rawValue === "string" ? rawValue.length : 0,
    trimmedLength: typeof normalizedValue === "string" ? normalizedValue.length : 0,
    first4Chars: typeof normalizedValue === "string" ? normalizedValue.slice(0, 4) : "",
    last4Chars: typeof normalizedValue === "string" ? normalizedValue.slice(-4) : "",
    preview: maskSecret(normalizedValue),
    jsonEncodedRawValue: typeof rawValue === "string" ? JSON.stringify(rawValue) : rawValue,
  };
};

export const getEnvironmentVariableDiagnostics = (variableNames, env = process.env) =>
  Object.fromEntries(variableNames.map((variableName) => [variableName, describeEnvValue(env[variableName])]));

export const describeApiKeyFormat = (value) => {
  const rawValue = value === undefined ? undefined : String(value);
  const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;
  const hasValue = Boolean(normalizedValue);
  const normalizedString = hasValue ? String(normalizedValue) : "";
  const segments = normalizedString ? normalizedString.split("-").filter(Boolean) : [];

  let format = "missing";

  if (hasValue) {
    if (UUID_LIKE_PATTERN.test(normalizedString)) {
      format = "uuid-like";
    } else if (/^ep-/i.test(normalizedString)) {
      format = "endpoint-id-like";
    } else if (/^sk-/i.test(normalizedString)) {
      format = "secret-key-like";
    } else {
      format = "opaque-token";
    }
  }

  return {
    format,
    hasValue,
    trimmedLength: normalizedString.length,
    containsWhitespace: /\s/.test(normalizedString),
    hyphenSegmentCount: segments.length,
    isUuidLike: UUID_LIKE_PATTERN.test(normalizedString),
  };
};

export const resolveDoubaoApiKey = ({ env = process.env, explicitValue } = {}) => {
  const resolutionChain = [
    {
      source: "createApiRouter apiKey option",
      variableName: null,
      value: explicitValue,
      details: describeEnvValue(explicitValue),
    },
    ...DOUBAO_API_KEY_ENV_NAMES.map((variableName) => ({
      source: `process.env.${variableName}`,
      variableName,
      value: env[variableName],
      details: describeEnvValue(env[variableName]),
    })),
  ];

  const matchedEntry =
    resolutionChain.find((entry) => normalizeEnvValue(entry.value)) || null;
  const resolvedValue = matchedEntry ? normalizeEnvValue(matchedEntry.value) : "";

  return {
    value: resolvedValue,
    source: matchedEntry?.source || "(missing)",
    variableName: matchedEntry?.variableName || null,
    details: describeEnvValue(resolvedValue),
    resolutionChain: resolutionChain.map((entry) => ({
      source: entry.source,
      variableName: entry.variableName,
      details: entry.details,
    })),
  };
};
