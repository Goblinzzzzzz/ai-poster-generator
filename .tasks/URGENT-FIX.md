# 紧急修复任务

## 问题 1: Prompt 变成 [object Object]

### 现象
用户输入的 prompt 在传递过程中变成了 `[object Object]`

### 原因
prompt-builder.js 中可能返回了对象而不是字符串

### 修复要求
- 检查 prompt-builder.js 返回值
- 确保 customPrompt 是字符串
- 修复 API 调用逻辑

---

## 问题 2: 删除社区/运营相关功能

### 需要删除的功能
- 点赞/收藏功能
- 评论功能
- 创作挑战/活动
- 排行榜

### 需要修改的文件
- src/App.jsx
- src/components/WorkCard.jsx
- src/components/WorkCardMenu.jsx
- 其他相关组件

---

## 执行顺序
1. 先修复 prompt [object Object] 问题（紧急）
2. 再删除社区/运营功能

## 验收标准
- 用户输入能正确传递到 API
- 生成的图片与 prompt 相关
- 社区/运营功能已删除
- 构建验证通过
- 测试通过
