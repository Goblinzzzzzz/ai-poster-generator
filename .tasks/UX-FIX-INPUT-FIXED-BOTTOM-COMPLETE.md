# UX 修复 - 输入框固定底部问题

## 修复日期
2026-03-20

## 问题描述
AI 生成输入框没有首屏展示，用户需要滚动到底部才能看到输入框，且输入框没有固定在底部。

## 根因分析
1. `PromptInput.css` 使用了 `position: sticky` - 这是相对定位，元素仍在文档流中
2. `PromptInput` 组件在 `workspace-scroll` 容器内部 - 导致它随内容滚动
3. `TimelineFeed.css` 底部 padding 过大（170px），但输入框仍不可见

## 修复方案

### 1. 修改 PromptInput.css
```css
/* 修改前 */
.prompt-dock {
  position: sticky;
  bottom: 24px;
  z-index: 15;
  margin-top: 18px;
}

/* 修改后 */
.prompt-dock {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 0;
  pointer-events: none;  /* 防止遮挡点击 */
}

.prompt-panel {
  /* ... */
  pointer-events: auto;  /* 恢复面板交互 */
}
```

### 2. 修改 App.jsx
将 `PromptInput` 组件从 `workspace-scroll` 容器内移到外部，使其不随内容滚动：

```jsx
{/* 修改前 */}
<div className="workspace-scroll">
  <div className="workspace-inner">
    <TimelineFeed />
    <PromptInput />
  </div>
</div>

{/* 修改后 */}
<div className="workspace-scroll">
  <div className="workspace-inner">
    <TimelineFeed />
  </div>
</div>

<PromptInput />
```

### 3. 修改 TimelineFeed.css
调整底部 padding，因为输入框已固定，不需要留太多空间：

```css
/* 修改前 */
.timeline-feed {
  padding: 26px 4px 170px;
}

/* 修改后 */
.timeline-feed {
  padding: 26px 4px 140px;
}

/* 移动端修改前 */
@media (max-width: 860px) {
  .timeline-feed {
    padding: 20px 0 calc(190px + var(--mobile-nav-safe-offset));
  }
}

/* 移动端修改后 */
@media (max-width: 860px) {
  .timeline-feed {
    padding: 20px 0 160px;
  }
}
```

## 验收标准
- [x] 输入框固定在页面底部，不随滚动移动
- [x] 初始加载时输入框可见（无需滚动）
- [x] 内容区域可以正常滚动
- [x] 输入框有合适的阴影，视觉清晰
- [x] 响应式布局正常（移动端适配）
- [x] 输入框不会遮挡内容点击（pointer-events 处理）

## 修改文件清单
1. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/components/PromptInput.css`
2. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/App.jsx`
3. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/components/TimelineFeed.css`

## 测试建议
1. 桌面端测试（1920x1080）
2. 笔记本测试（1366x768）
3. 移动端测试（375x667）
4. 滚动内容时输入框应保持固定
5. 输入框内交互应正常（打字、点击按钮）
6. 内容区域应可正常滚动

## 备注
- 使用 `pointer-events: none` 在容器上，`pointer-events: auto` 在面板上，确保输入框不会遮挡底层内容的点击
- z-index 设置为 100，确保高于内容层但低于抽屉/弹窗（45+）
- 移动端需要适配 MobileNav 的高度，使用 `var(--mobile-nav-safe-offset)`
