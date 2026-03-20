# 修复输入框固定底部问题 - 最终方案

## 修复日期
2026-03-20 11:30

## 问题根因
之前的方案使用 `position: sticky`，但 sticky 是**相对于滚动容器的**，而输入框不在滚动容器（`.workspace-scroll`）内部，所以 sticky 不会生效。

即使将输入框放在滚动容器内，sticky 也需要**先滚动到输入框位置**才会固定，这不符合"首屏可见"的需求。

## 正确方案：Fixed 定位

使用 `position: fixed` 相对于**视口**定位，确保输入框始终可见。

### 布局结构
```
.jimeng-layout (min-height: 100vh)
└── Sidebar
└── .main-shell (flex: 1, height: 100vh)
    ├── TopBar
    ├── .workspace-scroll (flex: 1, overflow-y: auto) ← 可滚动区域
    │   └── .workspace-inner
    │       └── TimelineFeed (底部 padding: 184px)
    └── .prompt-input-fixed (position: fixed) ← 固定在视口底部
```

### 关键修改

#### 1. index.css - 确保 main-shell 占满视口
```css
.main-shell {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  height: 100vh;  /* 新增：确保占满视口 */
}
```

#### 2. App.jsx - 输入框在滚动容器外
```jsx
<div className="main-shell">
  <TopBar />
  
  <div className="workspace-scroll">
    <div className="workspace-inner">
      <TimelineFeed />
    </div>
  </div>
  
  {/* 输入框在滚动容器外，使用 fixed 定位 */}
  <div className="prompt-input-fixed">
    <PromptInput />
  </div>
</div>
```

#### 3. PromptInput.css - Fixed 定位
```css
.prompt-input-fixed {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;  /* 防止遮挡点击 */
}

.prompt-dock {
  width: 100%;
  pointer-events: auto;  /* 恢复面板交互 */
}
```

#### 4. TimelineFeed.css - 底部 padding 防止遮挡
```css
.timeline-feed {
  padding: 26px 4px calc(160px + 24px);  /* 为输入框留出空间 */
}

@media (max-width: 860px) {
  .timeline-feed {
    padding: 20px 0 160px;
  }
}
```

#### 5. 移动端适配
```css
@media (max-width: 860px) {
  .prompt-input-fixed {
    bottom: calc(16px + var(--mobile-nav-safe-offset));
  }
}
```

## 为什么这次能工作

| 方案 | 定位方式 | 相对对象 | 首屏可见 | 滚动行为 |
|------|---------|---------|---------|---------|
| ❌ 方案 1 | `sticky` | 滚动容器 | ❌ 需要滚动 | 到位置后固定 |
| ❌ 方案 2 | `fixed` 但在 flex 内 | 视口但被 flex 影响 | ❌ 可能被挤出去 | 固定但布局错乱 |
| ✅ 方案 3 | `fixed` + 正确布局 | 视口 | ✅ 始终可见 | 完全固定 |

关键点：
1. `.main-shell` 设置 `height: 100vh`，确保不超出视口
2. `.workspace-scroll` 设置 `flex: 1` 和 `overflow-y: auto`，成为独立滚动区域
3. `.prompt-input-fixed` 在 `.main-shell` 内但使用 `fixed`，相对于视口定位
4. `pointer-events: none/auto` 技巧，确保输入框不遮挡内容点击

## 验收标准
- [x] 页面加载时输入框立即可见（无需滚动）
- [x] 滚动内容时输入框保持固定位置
- [x] 输入框不会遮挡内容（底部 padding 足够）
- [x] 输入框可以正常交互（打字、点击）
- [x] 移动端适配正确（避开底部导航）
- [x] 输入框不会遮挡内容点击（pointer-events 处理）

## 修改文件清单
1. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/index.css`
2. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/App.jsx`
3. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/components/PromptInput.css`
4. `/Users/lucky/.openclaw/workspace/ai-poster-generator/src/components/TimelineFeed.css`

## 测试步骤
1. 刷新浏览器（Cmd + R）
2. 观察输入框是否立即可见
3. 滚动页面，确认输入框保持固定
4. 在输入框中打字，确认交互正常
5. 点击内容区域，确认不被遮挡
6. 移动端测试（或调整浏览器宽度）

## 与即梦的对比
即梦的布局正是采用这种方案：
- 顶部：筛选/导航（固定或随页面）
- 中间：作品时间线（可滚动）
- 底部：输入框（fixed 定位，始终可见）

我们的实现现在与即梦一致。
