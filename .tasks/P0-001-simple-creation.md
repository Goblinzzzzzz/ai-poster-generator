# 任务：P0-001 极简创作模式

## 任务描述
将当前的左右分栏布局改为居中沉浸式创作体验，隐藏高级参数，用户只需输入文字即可生成。

## 验收标准
- [ ] 单一文本框居中显示（宽度 800px+）
- [ ] 占位符引导文案："描述你想生成的画面..."
- [ ] 高级参数默认隐藏（可折叠）
- [ ] 生成按钮大尺寸、居中、渐变样式
- [ ] 首屏加载时间 < 2 秒
- [ ] 生成按钮点击反馈明显

## 技术要点
- 修改 src/App.jsx 主布局
- 更新 src/index.css 样式
- 默认参数配置：比例 9:16、风格"极简"

## 相关文件
- src/App.jsx
- src/index.css
- utils/prompt-builder.js

## 参考文档
- 飞书开发计划：https://www.feishu.cn/docx/Vou3drkX4obLYwxvMoccT3Ybngg
- 飞书任务：https://applink.feishu.cn/client/todo/detail?guid=0398783b-4556-493c-94a7-85cdeb5e10ca&suite_entity_num=t110909

---

## 执行步骤

### 1. 备份当前代码
```bash
cp src/App.jsx src/App.jsx.p0-001-backup
cp src/index.css src/index.css.p0-001-backup
```

### 2. 重写 App.jsx - 居中沉浸式布局

**核心修改：**
- 移除左右分栏布局
- 单一文本框居中（宽度 800px+）
- 高级参数折叠（默认关闭）
- 生成按钮大尺寸、居中

### 3. 重写 index.css - 极简风格

**核心样式：**
- 居中容器（max-width: 900px，margin: 0 auto）
- 大文本框（min-height: 200px，font-size: 1.125rem）
- 渐变按钮（宽度 100%，大尺寸）
- 隐藏高级参数的折叠面板

### 4. 构建验证
```bash
npm run build
```

### 5. 提交代码
```bash
git add -A
git commit -m "feat(P0-001): 极简创作模式 - 居中沉浸式布局"
git push origin main
```

---

## 完成标志
1. ✅ 代码修改完成
2. ✅ 构建验证通过
3. ✅ 代码已推送
4. ✅ 更新飞书文档进度

开始执行！
