#!/bin/bash
# 清理冗余筛选代码脚本

cd /Users/lucky/.openclaw/workspace/ai-poster-generator

echo "=== 开始清理冗余筛选代码 ==="

# 使用 sed 删除不需要的代码行
echo "1. 删除 mediaFilter 和 actionFilter 状态..."
sed -i '' '/const \[mediaFilter, setMediaFilter\]/d' src/App.jsx
sed -i '' '/const \[actionFilter, setActionFilter\]/d' src/App.jsx

echo "2. 删除筛选逻辑中的 media 和 action 部分..."
sed -i '' '/if (mediaFilter !== .all. && work.mediaType !== mediaFilter) {/,/}/d' src/App.jsx
sed -i '' '/if (actionFilter !== .all. && work.actionType !== actionFilter) {/,/}/d' src/App.jsx

echo "3. 更新 useMemo 依赖项..."
sed -i '' 's/\[actionFilter, allWorks, mediaFilter, searchValue, selectedView, timeFilter\]/[allWorks, searchValue, selectedView, timeFilter]/' src/App.jsx

echo "4. 删除常量定义..."
sed -i '' '/const MEDIA_FILTER_OPTIONS = \[/,/^\]/d' src/App.jsx
sed -i '' '/const ACTION_FILTER_OPTIONS = \[/,/^\]/d' src/App.jsx

echo "5. 清理 TopBar props..."
sed -i '' '/mediaFilter,/d' src/App.jsx
sed -i '' '/actionFilter,/d' src/App.jsx

echo "=== 清理完成 ==="
git status
