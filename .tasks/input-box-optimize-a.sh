#!/bin/bash
# 输入框优化方案 A - 任务脚本

echo "=== 输入框优化方案 A ==="
echo "目标：添加引导文案 + 优化占位符 + 3 个功能入口按钮"
echo "文件：src/components/PromptInput.jsx, src/components/PromptInput.css"
echo ""

# 使用 Codex CLI 执行修改
codex exec "
修改 PromptInput.jsx 和 PromptInput.css，实现输入框优化方案 A：

1. 在 PromptInput.jsx 的 prompt-panel 开头（prompt-shortcuts 之前）添加引导文案：
   - 添加一个 div，class 为 prompt-guide
   - 文案：'描述你想要的画面，AI 帮你实现'

2. 优化 placeholder 文案为：
   '描述主体、场景、风格，例如：一只猫咪在窗台上晒太阳，温暖的光线，治愈系配色'

3. 在 prompt-shortcuts 下方添加 3 个功能入口按钮：
   - 🎨 图片生成
   - 🎬 视频生成  
   - ✨ 文案优化
   使用 button 元素，class 为 prompt-feature-btn

4. 在 PromptInput.css 中添加对应样式：
   - .prompt-guide: 浅灰色小字，margin-bottom: 8px
   - .prompt-feature-btn: 小圆角按钮，图标 + 文字，悬停效果

修改完成后执行：git add -A && git commit -m 'feat: 输入框优化方案 A'
"

echo ""
echo "=== 任务完成 ==="
