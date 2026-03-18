#!/bin/bash
# 任务：ai-poster-generator 项目优化
# 1. 评估前端是否保留 API 相关代码
# 2. 优化图片生成 prompt，避免图片中出现尺寸信息等文字

set -e

echo "=========================================="
echo "任务：ai-poster-generator 项目优化"
echo "=========================================="
echo ""

# ========== 任务 1：评估前端代码结构 ==========
echo "【任务 1】评估前端是否保留 API 相关代码和目录"
echo ""

echo "1.1 检查前端目录结构..."
find src -type f -name "*.jsx" -o -name "*.js" | head -20
echo ""

echo "1.2 检查前端是否有直接调用 Doubao API 的代码..."
grep -r "doubao\|DOUBAO\|ark.cn-beijing" src/ --include="*.jsx" --include="*.js" || echo "未发现前端直接调用 Doubao 的代码"
echo ""

echo "1.3 检查前端调用后端 API 的方式..."
grep -r "fetch\|axios\|/api/" src/ --include="*.jsx" --include="*.js" | head -20
echo ""

echo "1.4 检查 src/config.js 配置..."
cat src/config.js
echo ""

echo "1.5 检查是否有不必要的 API 相关目录..."
ls -la src/
echo ""

# ========== 任务 2：分析图片生成问题 ==========
echo ""
echo "【任务 2】分析图片生成 prompt 问题"
echo ""

echo "2.1 检查当前 prompt 构建逻辑..."
cat utils/prompt-builder.js
echo ""

echo "2.2 查看前端传递的参数..."
grep -A30 "posterType\|sizeTemplate" src/App.jsx | head -50
echo ""

echo "2.3 检查生成图片时的完整请求体..."
grep -B5 -A20 "createDoubaoRequestBody" utils/doubao.js | head -40
echo ""

# ========== 输出分析结论 ==========
echo ""
echo "=========================================="
echo "分析结论"
echo "=========================================="
echo ""

echo "【问题 1：前端代码结构】"
echo "- 前端是否应该保留 API 相关代码？"
echo "- 当前前端是否直接调用 Doubao API？"
echo "- 有哪些可以清理的冗余代码？"
echo ""

echo "【问题 2：Prompt 优化】"
echo "当前问题分析："
echo "1. 图片中出现尺寸信息（如 1080×1940）"
echo "2. 图片中出现'手机版'等文字"
echo "3. 原因：prompt 中包含了尺寸描述，被模型误解为需要在图片中展示"
echo ""

echo "优化建议："
echo "1. prompt 中明确说明'不要在图片中显示任何文字'"
echo "2. 尺寸信息仅作为 API 参数，不写入 prompt"
echo "3. 使用负面提示词排除文字元素"
echo ""

echo "=========================================="
echo "分析完成"
echo "=========================================="
