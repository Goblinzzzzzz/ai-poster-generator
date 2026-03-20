# 修复输入框固定底部问题

## 问题
AI 生成输入框没有首屏展示，需要滑动到底部才能看到，也没有做位置固定。

## 修复方案

### 1. 修改 PromptInput.css
将 `position: sticky` 改为 `position: fixed`，并确保固定在底部可见。

### 2. 修改 App.jsx 布局
确保 PromptInput 在视口内，而不是在滚动内容底部。

### 3. 调整 TimelineFeed.css
移除底部大 padding，因为输入框已固定。

## 执行步骤

1. 修改 `src/components/PromptInput.css`
2. 修改 `src/App.jsx` 
3. 修改 `src/components/TimelineFeed.css`
4. 测试验证
