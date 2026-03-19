# P1 阶段 - 核心体验修复任务

## 任务概述
修复当前页面的核心体验问题，提升用户体验。

---

## P1-001: 修复时间线排序（正序）

### 问题
当前最新生成的作品在最上面（倒序），用户希望最新生成的在最下面（正序）。

### 要求
- 修改 TimelineFeed 组件
- 作品按时间正序排列（旧的在上，新的在下）
- 保持无限滚动加载功能

### 文件
- src/components/TimelineFeed.jsx

---

## P1-002: 实现图片点击放大查看

### 要求
- 点击图片全屏查看
- 支持缩放（双击/捏合）
- 支持关闭（点击背景/ESC）
- 支持左右切换（如果有多个图片）

### 文件
- src/components/Lightbox.jsx (新建)
- src/components/Lightbox.css (新建)
- src/components/WorkCard.jsx (修改)
- src/App.jsx (集成)

---

## P1-003: 实现图片下载功能

### 要求
- 作品卡片添加下载按钮
- 右键菜单支持保存图片
- Lightbox 中支持下载

### 文件
- src/components/WorkCard.jsx (修改)
- src/components/Lightbox.jsx (修改)
- src/utils/download.js (新建)

---

## P1-004: 实现作品卡片更多操作菜单

### 要求
- 点击"..."弹出菜单
- 菜单选项：
  - 重新生成
  - 编辑
  - 分享
  - 下载
  - 删除
- 点击外部关闭菜单

### 文件
- src/components/WorkCardMenu.jsx (新建)
- src/components/WorkCardMenu.css (新建)
- src/components/WorkCard.jsx (修改)

---

## P1-005: 修复导航/筛选/搜索功能

### 问题
- 切换导航后内容不更新
- 筛选后作品列表不更新
- 搜索后作品列表不更新

### 要求
- 修复导航切换逻辑
- 修复筛选功能（时间/类型/操作）
- 修复搜索功能
- 确保数据流正确

### 文件
- src/App.jsx (修改)
- src/components/TimelineFeed.jsx (修改)
- src/components/TopBar.jsx (修改)

---

## 执行顺序
1. P1-001 修复时间线排序
2. P1-005 修复导航/筛选/搜索功能
3. P1-002 实现图片点击放大
4. P1-003 实现图片下载
5. P1-004 实现更多操作菜单

## 验收标准
- 所有修复功能正常工作
- 构建验证通过
- 测试通过
- 用户体验流畅

---

**开始执行！完成后告诉我修改了哪些文件和 commit hash。**
