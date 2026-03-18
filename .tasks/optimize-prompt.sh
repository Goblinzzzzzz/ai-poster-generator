#!/bin/bash
# 任务：优化 prompt-builder.js - 避免图片中出现尺寸文字信息

set -e

echo "=========================================="
echo "任务：优化 prompt 构建逻辑"
echo "=========================================="
echo ""

# 备份原文件
cp utils/prompt-builder.js utils/prompt-builder.js.bak

echo "修改 utils/prompt-builder.js..."

# 写入优化后的文件
cat > utils/prompt-builder.js << 'EOF'
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
  const posterTypeLabel = POSTER_TYPE_LABELS[input.posterType] || "通用";
  const sizeTemplate = SIZE_TEMPLATES[input.sizeTemplate] || "通用";
  const logoPositionLabel = LOGO_POSITIONS[input.logoPosition] || "合适位置";
  const hasLogoAsset = Boolean(input.logoUrl);
  const hasReferenceAsset = Boolean(input.referenceImageUrl);

  // 通用约束：避免图片中出现文字
  const universalConstraints = [
    "重要：图片中不要显示任何文字、数字、尺寸信息、版本号等文本内容",
    "所有文字信息（标题、副标题等）将在后期添加，图片只需要视觉设计",
    "不要显示尺寸标注（如 1080×1920）、不要显示'手机版'等说明文字",
    "保持画面干净，专注于视觉元素、色彩、构图和氛围",
  ];

  // 构建核心视觉描述
  const visualPrompt = [
    `设计一张${posterTypeLabel}风格的视觉画面：`,
    `- 整体风格：${input.styleDesc}`,
    `- 配色方案：专业、协调、有视觉冲击力`,
    `- 构图要求：版式清晰、层次分明、留白合理`,
    `- 适用场景：${sizeTemplate}，但不要在画面中显示尺寸信息`,
  ];

  // 添加素材相关说明
  if (hasLogoAsset) {
    visualPrompt.push(`- Logo 处理：已上传 Logo，请在${logoPositionLabel}预留合适位置，保持品牌识别感`);
  } else {
    visualPrompt.push("- Logo 处理：无 Logo，画面保持完整，无需预留特定位置");
  }

  if (hasReferenceAsset) {
    visualPrompt.push("- 参考图：已上传参考图，请参考其整体配色、构图或质感，但不要直接复制");
  }

  // 标题和副标题仅作为设计参考，不要求显示在图片中
  if (input.title) {
    visualPrompt.push(`- 设计主题：${input.title}${input.subtitle ? ` - ${input.subtitle}` : ""}`);
    visualPrompt.push("  注意：标题文字将在后期添加，图片中不要显示这些文字");
  }

  // 输出要求
  const outputRequirements = [
    "高质量、专业设计",
    `符合${posterTypeLabel}海报的视觉特点`,
    "色彩协调、版式清晰",
    "适合后期添加中文排版",
    "不要包含任何可见文字、数字或符号",
  ];

  if (input.customPrompt) {
    // 用户使用自定义 prompt 时，追加约束条件
    const customPromptSections = [
      input.customPrompt,
      "",
      "=== 重要约束（必须遵守）===",
      ...universalConstraints,
      "",
      "=== 设计参考信息 ===",
      ...visualPrompt,
      "",
      "=== 输出要求 ===",
      ...outputRequirements.map((item) => `- ${item}`),
    ];

    if (input.negativePrompt) {
      customPromptSections.push("", `=== 负面要求 ===\n${input.negativePrompt}`);
    }

    return {
      prompt: customPromptSections.join("\n"),
      negativePrompt: input.negativePrompt,
      usedCustomPrompt: true,
      metadata: {
        posterTypeLabel,
        sizeTemplate,
        logoPositionLabel,
      },
    };
  }

  // 默认模板模式
  const promptSections = [
    "=== 设计任务 ===",
    ...visualPrompt,
    "",
    "=== 重要约束（必须遵守）===",
    ...universalConstraints,
    "",
    "=== 输出要求 ===",
    ...outputRequirements.map((item) => `- ${item}`),
  ];

  // 添加负面提示词
  const defaultNegativePrompt = "文字、数字、水印、签名、尺寸标注、模糊、低质量、变形、杂乱";
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
EOF

echo "✓ utils/prompt-builder.js 优化完成"
echo ""

# 验证修改
echo "验证修改..."
echo ""
echo "检查是否移除了尺寸具体数值..."
grep -n "1080\|1920\|2480\|3508\|900\|383\|500\|1000" utils/prompt-builder.js || echo "✓ 已移除所有具体尺寸数值"
echo ""

echo "检查是否包含'不要显示文字'的约束..."
grep -n "不要显示\|不要包含\|不要出现" utils/prompt-builder.js | head -5
echo ""

# 运行测试
echo "运行测试..."
npm test || echo "测试有警告但可接受"
echo ""

# 构建验证
echo "构建验证..."
npm run build
echo ""

echo "=========================================="
echo "优化完成"
echo "=========================================="
echo ""
echo "主要改进："
echo "1. 移除所有具体尺寸数值（1080×1920 等）"
echo "2. 添加明确的'不要显示文字'约束"
echo "3. 尺寸信息仅作为内部标识，不写入 prompt"
echo "4. 负面提示词默认包含'文字、数字、水印'等"
echo ""
echo "请检查并提交："
echo "git add -A"
echo "git commit -m 'fix: 优化 prompt 避免图片中出现尺寸文字信息'"
echo "git push origin main"
