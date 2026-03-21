import { createIntent } from "./schema.js";

const LEADING_PROMPT_PATTERN = /^(请|帮我|给我|做一个|做一张|做个|生成一张|生成一个|生成|来一张|想要一张)\s*/i;
const TRAILING_POSTER_PATTERN = /(海报|封面|宣传图|主视觉|kv)$/i;
const CLAUSE_SPLIT_PATTERN = /[，,。；;\n]/;

const SUBJECT_TYPE_RULES = [
  { type: "product", pattern: /(护肤|精华|面霜|香水|产品|饮料|咖啡|奶茶|瓶|包装|耳机|手机|手表|新品|海报)/i },
  { type: "portrait", pattern: /(女生|女孩|女性|男生|男人|人物|模特|人像|跑者|青年|老人)/i },
  { type: "animal", pattern: /(猫|狗|兔|鸟|熊猫|狐狸|小熊|宠物)/i },
  { type: "food", pattern: /(蛋糕|汉堡|拉面|寿司|牛排|甜点|冰淇淋|食物|美食)/i },
  { type: "space", pattern: /(建筑|街道|长廊|展厅|办公室|客厅|空间|室内|城市)/i },
];

const STYLE_RULES = [
  { pattern: /(极简|简约)/i, label: "极简商业海报" },
  { pattern: /(高级|高端|奢华)/i, label: "高端编辑感" },
  { pattern: /(电影感|cinematic)/i, label: "电影感写实摄影" },
  { pattern: /(胶片|复古)/i, label: "胶片色彩" },
  { pattern: /(科技|未来)/i, label: "科技未来感" },
  { pattern: /(治愈|温暖)/i, label: "温暖治愈氛围" },
  { pattern: /(品牌|campaign)/i, label: "品牌 campaign 质感" },
];

const COMPOSITION_RULES = [
  { pattern: /(中心构图|居中)/i, label: "中心构图" },
  { pattern: /(留白|版式)/i, label: "保留排版留白" },
  { pattern: /(特写|近景)/i, label: "主体特写" },
  { pattern: /(俯拍)/i, label: "轻微俯拍" },
  { pattern: /(远景|全景)/i, label: "宽幅场景展示" },
];

const LIGHTING_RULES = [
  { pattern: /(晨光|清晨)/i, label: "柔和晨光" },
  { pattern: /(逆光)/i, label: "侧逆光" },
  { pattern: /(柔光)/i, label: "柔和漫射光" },
  { pattern: /(冷光|冷白)/i, label: "冷白主光" },
  { pattern: /(暖光|夕阳|黄昏)/i, label: "暖色自然光" },
];

const MATERIAL_RULES = [
  { pattern: /(玻璃)/i, label: "玻璃材质" },
  { pattern: /(金属)/i, label: "金属反射" },
  { pattern: /(水珠|冷凝)/i, label: "冷凝水珠细节" },
  { pattern: /(毛发)/i, label: "毛发层次" },
  { pattern: /(布料|棉麻|服装)/i, label: "织物纹理" },
  { pattern: /(冰块|霜)/i, label: "冰霜质感" },
];

const COLOR_RULES = [
  "冰川蓝",
  "蓝白",
  "银白",
  "冷白",
  "暖米色",
  "浅绿色",
  "金色",
  "粉色",
  "橙色",
  "黑金",
];

const POSTER_TYPE_SUBJECTS = {
  brand: "品牌主视觉",
  culture: "文化主题视觉",
  festival: "节日主题视觉",
  notice: "信息通知海报",
  training: "培训主题视觉",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const splitClauses = (value) =>
  normalizeText(value)
    .split(CLAUSE_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);

const pickFirstMatch = (text, rules) => rules.find((rule) => rule.pattern.test(text))?.label || "";

const pickMatchedLabels = (text, rules) =>
  Array.from(new Set(rules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label)));

const extractSubject = ({ rawPrompt, title, posterType }) => {
  const primaryClause = splitClauses(rawPrompt)[0] || normalizeText(title);
  const cleanedSubject = primaryClause
    .replace(LEADING_PROMPT_PATTERN, "")
    .replace(TRAILING_POSTER_PATTERN, "")
    .trim();

  if (cleanedSubject) {
    return cleanedSubject;
  }

  return POSTER_TYPE_SUBJECTS[posterType] || POSTER_TYPE_SUBJECTS.training;
};

const inferSubjectType = (text) => SUBJECT_TYPE_RULES.find((rule) => rule.pattern.test(text))?.type || "generic";

const extractScene = (clauses = []) => {
  const sceneClause = clauses.find((clause) => /(窗边|窗台|室内|户外|台面|街道|长廊|桌面|海边|城市|森林|棚拍)/i.test(clause));
  return sceneClause || "";
};

const extractMood = (text) => {
  const moodLabels = [];

  if (/(高级|高端)/i.test(text)) {
    moodLabels.push("高级感");
  }

  if (/(治愈|温暖)/i.test(text)) {
    moodLabels.push("治愈感");
  }

  if (/(力量|张力)/i.test(text)) {
    moodLabels.push("力量感");
  }

  if (/(夏天|夏日|清凉)/i.test(text)) {
    moodLabels.push("夏日感");
  }

  return moodLabels.join("、");
};

const extractColorHints = (text) => COLOR_RULES.filter((color) => text.includes(color));

export const normalizeIntent = ({
  rawPrompt,
  title,
  subtitle,
  styleHint,
  posterType = "training",
  mode = "image",
  referenceImageUrl = "",
  preferences = {},
} = {}) => {
  const normalizedPrompt = normalizeText(rawPrompt);
  const normalizedTitle = normalizeText(title);
  const normalizedSubtitle = normalizeText(subtitle);
  const normalizedStyleHint = normalizeText(styleHint);
  const mergedText = [normalizedPrompt, normalizedTitle, normalizedSubtitle, normalizedStyleHint].filter(Boolean).join("，");
  const clauses = splitClauses(mergedText);
  const subject = extractSubject({ rawPrompt: normalizedPrompt || mergedText, title: normalizedTitle, posterType });
  const subjectType = inferSubjectType(mergedText || subject);

  return createIntent({
    rawPrompt: normalizedPrompt,
    title: normalizedTitle,
    subtitle: normalizedSubtitle,
    styleHint: normalizedStyleHint,
    posterType,
    mode,
    referenceImageUrl,
    preferences,
    summary: {
      subject,
      subjectType,
      scene: extractScene(clauses),
      mood: extractMood(mergedText),
      explicitStyle: pickMatchedLabels(mergedText, STYLE_RULES).join("、"),
      explicitComposition: pickMatchedLabels(mergedText, COMPOSITION_RULES).join("、"),
      explicitLighting: pickMatchedLabels(mergedText, LIGHTING_RULES).join("、"),
      explicitMaterial: pickMatchedLabels(mergedText, MATERIAL_RULES).join("、"),
      colorHints: extractColorHints(mergedText),
    },
  });
};

export const inferIntentDefaults = (subjectType, posterType) => {
  if (subjectType === "product") {
    return {
      scene: "极简商业摄影台面",
      style: posterType === "brand" ? "高端商业产品摄影" : "商业产品海报",
      composition: "主体突出并保留文案留白",
      camera: "85mm 产品特写",
      lighting: "主光叠加柔和轮廓光",
      material: "玻璃、金属与细节反射",
      color: "干净统一的品牌配色",
    };
  }

  if (subjectType === "animal") {
    return {
      scene: "安静的生活方式场景",
      style: "治愈系写实摄影",
      composition: "主体靠近视觉焦点并保留呼吸感",
      camera: "50mm 近景",
      lighting: "柔和自然光",
      material: "毛发层次与环境纹理清晰",
      color: "柔和低饱和配色",
    };
  }

  if (subjectType === "portrait") {
    return {
      scene: "真实商业场景",
      style: "人物品牌摄影",
      composition: "人物主体清晰并预留排版空间",
      camera: "35mm 至 50mm 人像镜头",
      lighting: "自然主光加轮廓层次",
      material: "服装纹理与皮肤质感自然",
      color: "统一品牌色调",
    };
  }

  if (subjectType === "food") {
    return {
      scene: "桌面陈列场景",
      style: "食物商业摄影",
      composition: "主体特写并控制背景干净",
      camera: "50mm 微距视角",
      lighting: "柔和顶光",
      material: "食材纹理和蒸汽细节清晰",
      color: "高食欲度配色",
    };
  }

  return {
    scene: "适合海报表达的整洁场景",
    style: posterType === "brand" ? "品牌海报质感" : "写实海报风格",
    composition: "主体明确并保留版式空间",
    camera: "中景海报视角",
    lighting: "自然均衡光线",
    material: "关键材质细节清晰",
    color: "统一协调的配色",
  };
};
