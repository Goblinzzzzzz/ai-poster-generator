const DEFAULT_REPLACEMENT = "视觉元素";

const HARD_BLOCK_RULES = [
  {
    category: "政治",
    replacement: "公共主题",
    pattern:
      /(国家领导人|领导人肖像|政党宣传|选举海报|抗议活动|游行示威|政治动员|敏感政治事件|宗教冲突)/giu,
  },
  {
    category: "暴力",
    replacement: "戏剧张力",
    pattern:
      /(恐怖袭击|炸弹袭击|枪击现场|血腥场面|尸体细节|肢解|虐杀|自杀|自残|爆头|恐怖组织)/giu,
  },
  {
    category: "成人",
    replacement: "时尚人物",
    pattern:
      /(未成年人[^\n]{0,12}(裸露|性感)|露点|性行为|成人视频|成人影片|情色写真|色情内容)/giu,
  },
  {
    category: "违法",
    replacement: "抽象概念",
    pattern: /(毒品交易|制毒|赌博网站|诈骗话术|洗钱|违禁品交易)/giu,
  },
];

const SOFT_REWRITE_RULES = [
  { category: "政治", replacement: "公共主题", pattern: /(政治|政府|政务|选举|议会|示威|游行)/giu },
  { category: "暴力", replacement: "强烈张力", pattern: /(枪械|枪支|子弹|炮火|炸弹|爆炸|血腥|杀戮|暴力|战场)/giu },
  { category: "成人", replacement: "时尚", pattern: /(性感|情色|色情|裸露|裸体|挑逗)/giu },
  { category: "违法", replacement: "风险元素", pattern: /(毒品|赌博|诈骗|违禁品)/giu },
];

const DOUBAO_SENSITIVE_ERROR_PATTERN =
  /(sensitive information|sensitive content|敏感信息|内容安全|安全策略|input text may contain sensitive)/iu;
const WHITELIST_TERMS = [
  "龙",
  "青龙",
  "白龙",
  "黑龙",
  "巨龙",
  "飞龙",
  "神龙",
  "凤凰",
  "朱雀",
  "玄武",
  "麒麟",
  "独角兽",
  "天马",
  "鲲",
  "老虎",
  "狮子",
  "熊猫",
  "孔雀",
  "仙鹤",
].sort((left, right) => right.length - left.length);
const WHITELIST_TOKEN_PREFIX = "__SAFE_TERM_";
const FIELD_MAX_LENGTHS = {
  title: 50,
  subtitle: 200,
  styleDesc: 120,
  customPrompt: 1000,
  negativePrompt: 300,
};
const DEFAULT_FILTER_FIELDS = ["title", "subtitle", "styleDesc", "customPrompt", "negativePrompt"];

export const normalizeInputText = (value, maxLength = 1000) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const protectWhitelistedTerms = (text) => {
  const tokenMap = new Map();
  let protectedText = String(text || "");

  for (const [index, term] of WHITELIST_TERMS.entries()) {
    if (!protectedText.includes(term)) {
      continue;
    }

    const token = `${WHITELIST_TOKEN_PREFIX}${index}__`;
    protectedText = protectedText.replaceAll(term, token);
    tokenMap.set(token, term);
  }

  return {
    protectedText,
    tokenMap,
  };
};

const restoreWhitelistedTerms = (text, tokenMap = new Map()) => {
  let restoredText = String(text || "");

  for (const [token, term] of tokenMap.entries()) {
    restoredText = restoredText.replaceAll(token, term);
  }

  return restoredText;
};

const collectMatches = (text, rules) => {
  const matches = [];

  for (const rule of rules) {
    rule.pattern.lastIndex = 0;

    if (rule.pattern.test(text)) {
      matches.push({
        category: rule.category,
        replacement: rule.replacement || DEFAULT_REPLACEMENT,
      });
    }
  }

  return matches;
};

export const createSensitivePromptMessage = (matches = []) => {
  const categories = Array.from(new Set(matches.map((item) => item.category))).filter(Boolean);
  const categoryText = categories.length > 0 ? categories.join("、") : "敏感";

  return `当前描述包含 Doubao 容易拦截的${categoryText}相关内容，请改用品牌、主体、材质、光线、配色、构图等中性视觉描述后重试。`;
};

export const filterSensitiveText = (value, { maxLength = 1000, strict = false } = {}) => {
  const normalized = normalizeInputText(value, maxLength);

  if (!normalized) {
    return {
      value: "",
      blocked: [],
      replacements: [],
    };
  }

  const { protectedText, tokenMap } = protectWhitelistedTerms(normalized);
  const blocked = collectMatches(protectedText, HARD_BLOCK_RULES);
  let filteredValue = protectedText;
  const replacements = [];

  if (strict && blocked.length > 0) {
    return {
      value: normalized,
      blocked,
      replacements,
    };
  }

  const activeRules = strict ? SOFT_REWRITE_RULES : [...HARD_BLOCK_RULES, ...SOFT_REWRITE_RULES];

  for (const rule of activeRules) {
    rule.pattern.lastIndex = 0;

    if (!rule.pattern.test(filteredValue)) {
      continue;
    }

    rule.pattern.lastIndex = 0;
    filteredValue = filteredValue.replace(rule.pattern, rule.replacement || DEFAULT_REPLACEMENT);
    replacements.push({
      category: rule.category,
      replacement: rule.replacement || DEFAULT_REPLACEMENT,
    });
  }

  return {
    value: normalizeInputText(restoreWhitelistedTerms(filteredValue, tokenMap), maxLength),
    blocked,
    replacements,
  };
};

export const filterSensitivePayload = (payload = {}, { strict = false, fields = DEFAULT_FILTER_FIELDS } = {}) => {
  const sanitized = { ...payload };
  const blocked = [];
  const replacements = [];

  for (const fieldName of fields) {
    const result = filterSensitiveText(payload[fieldName], {
      maxLength: FIELD_MAX_LENGTHS[fieldName] || 300,
      strict,
    });

    sanitized[fieldName] = result.value;
    blocked.push(...result.blocked.map((item) => ({ ...item, field: fieldName })));
    replacements.push(...result.replacements.map((item) => ({ ...item, field: fieldName })));
  }

  return {
    sanitized,
    blocked,
    replacements,
  };
};

export const isDoubaoSensitiveError = (message) => DOUBAO_SENSITIVE_ERROR_PATTERN.test(String(message || ""));
