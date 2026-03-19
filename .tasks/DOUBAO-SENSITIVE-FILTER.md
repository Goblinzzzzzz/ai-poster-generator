# Doubao API 敏感词过滤任务

## 问题分析
Doubao API 返回 400 错误：
"The request failed because the input text may contain sensitive information."

原因：prompt 中可能包含被误判为敏感内容的词汇。

## 解决方案

### 1. 创建敏感词过滤函数
过滤可能被误判的词汇：
- 政治相关
- 暴力相关
- 成人内容相关
- 其他敏感词

### 2. 简化 prompt 结构
- 移除可能被误判的描述
- 使用更安全的视觉描述词汇
- 避免抽象或隐喻表达

### 3. 添加输入验证
- 在接收用户输入时进行预检查
- 提供友好的错误提示
- 建议用户修改描述

## 需要修改的文件
- utils/prompt-builder.js - 添加敏感词过滤
- api/generate.js - 添加输入验证
- src/components/PromptInput.jsx - 前端输入提示

## 验收标准
- 敏感词被自动过滤
- 用户收到友好提示
- 生成成功率提升
