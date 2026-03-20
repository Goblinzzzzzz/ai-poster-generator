# 任务：清理冗余筛选代码

## 任务描述
TopBar 改造后删除了"类型筛选"和"操作筛选"，但 App.jsx 中仍保留相关筛选逻辑，需要清理冗余代码。

## 背景
- TopBar 已简化为只保留"搜索"和"时间筛选"
- 但 App.jsx 中仍有 `mediaFilter` 和 `actionFilter` 相关代码
- 需要清理以保持一致性

## 检查清单

### 1. 修改 App.jsx
- [ ] 删除 `mediaFilter` 状态
- [ ] 删除 `onMediaFilterChange` 处理函数
- [ ] 删除 `actionFilter` 状态
- [ ] 删除 `onActionFilterChange` 处理函数
- [ ] 删除 `MEDIA_FILTER_OPTIONS` 常量
- [ ] 删除 `ACTION_FILTER_OPTIONS` 常量
- [ ] 简化 `works` 的筛选逻辑（删除 media 和 action 筛选）
- [ ] 更新 `works` 的 useMemo 依赖项
- [ ] 删除 TopBar 组件中不需要的 props

### 2. 验证功能
- [ ] 导航切换正常
- [ ] 搜索功能正常
- [ ] 时间筛选正常
- [ ] 无控制台错误

## 相关文件
- `src/App.jsx`

## 验收标准
- [ ] 代码编译无错误
- [ ] 导航/搜索/筛选功能正常
- [ ] 无冗余代码
- [ ] 无控制台警告

## 输出要求
完成后告诉我：
1. 修改了哪些文件
2. commit hash
3. 遇到的问题（如有）

开始执行。
