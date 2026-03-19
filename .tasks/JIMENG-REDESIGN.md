# P0 阶段 - 完全对标即梦 UI 重构

## 任务目标
完全重构前端 UI，对标即梦网页版的布局和用户体验。

## 核心设计原则
1. 左侧导航栏 (灵感/生成/资产/画布)
2. 中间时间线展示历史作品
3. 底部居中输入框
4. 极简白色背景
5. 卡片式作品展示

---

## P0-001: 左侧导航栏

### 需求
创建左侧固定导航栏，包含核心功能入口。

### 具体要求
- 左侧固定宽度 (60-80px)
- 垂直排列导航项
- 图标 + 文字标签
- 选中状态高亮
- 响应式 (移动端可隐藏)

### 导航项
- 🏠 灵感
- ✨ 生成
- 📁 资产
- 🎨 画布
- 👤 用户头像 (底部)

### 文件
- src/components/Sidebar.jsx (新建)
- src/components/Sidebar.css (新建)
- src/App.jsx (集成)

---

## P0-002: 时间线作品展示区

### 需求
中间区域按时间线展示历史作品。

### 具体要求
- 按日期分组 (今天/昨天/具体日期)
- 卡片式作品展示
- 每个卡片包含：
  - 用户头像 + 提示词
  - 生成的图片/视频
  - 操作按钮 (重新编辑/再次生成/更多)
- 瀑布流布局
- 无限滚动加载

### 文件
- src/components/TimelineFeed.jsx (新建)
- src/components/WorkCard.jsx (新建)
- src/components/WorkCard.css (新建)
- src/App.jsx (集成)

---

## P0-003: 底部输入框

### 需求
底部居中大文本框，用于输入提示词。

### 具体要求
- 底部固定或 sticky
- 大文本框 (min-height: 80px)
- placeholder: "Seedance 2.0 全能参考，上传参考、输入文字，创意无限可能"
- 快捷按钮：
  - 🤖 Agent 模式
  - ⚡ 自动
  - 🔍 灵感搜索
  - 💡 创意设计
- 发送按钮 (右下角)

### 文件
- src/components/PromptInput.jsx (新建/重构)
- src/components/PromptInput.css (新建)
- src/App.jsx (集成)

---

## P0-004: 顶部工具栏

### 需求
顶部工具栏，包含全局操作。

### 具体要求
- 搜索图标
- 时间筛选下拉
- 生成类型筛选
- 操作类型筛选
- 用户菜单

### 文件
- src/components/TopBar.jsx (新建)
- src/components/TopBar.css (新建)
- src/App.jsx (集成)

---

## P0-005: 整体布局集成

### 需求
整合所有组件，形成完整布局。

### 布局结构
```jsx
<div className="jimeng-layout">
  <Sidebar />
  <div className="main-content">
    <TopBar />
    <TimelineFeed />
    <PromptInput />
  </div>
</div>
```

### 样式要求
- 白色背景 (#ffffff / #f8f9fa)
- 灰色文字 (#666 / #999)
- 蓝色主题色 (#2563eb)
- 卡片阴影 (轻微)
- 圆角设计 (8-12px)

### 文件
- src/App.jsx (重写)
- src/index.css (重写布局)

---

## 执行顺序
1. P0-001 左侧导航栏
2. P0-002 时间线作品展示区
3. P0-003 底部输入框
4. P0-004 顶部工具栏
5. P0-005 整体布局集成

## 验收标准
- 布局与即梦 90% 相似
- 响应式设计
- 构建验证通过
- 用户体验流畅

---

**开始执行！先从 P0-001 左侧导航栏开始。**
