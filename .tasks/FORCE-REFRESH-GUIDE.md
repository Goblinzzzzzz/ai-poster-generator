# 强制刷新浏览器缓存指南

## 问题
代码已修复，但浏览器可能缓存了旧的 CSS/JS 文件，导致修改不生效。

## 解决方案

### macOS / Chrome / Edge
1. **硬刷新**：`Cmd + Shift + R`
2. 或者：打开开发者工具（F12）→ 右键刷新按钮 → 选择"清空缓存并硬性重新加载"

### macOS / Safari
1. **硬刷新**：`Cmd + Option + R`
2. 或者：Safari 菜单 → 开发 → 清空缓存 → 刷新页面

### Windows / Chrome / Edge
1. **硬刷新**：`Ctrl + Shift + R`
2. 或者：`Ctrl + F5`

### Windows / Firefox
1. **硬刷新**：`Ctrl + Shift + R`

## 验证方法

刷新后，在浏览器中：

1. **打开开发者工具**（F12 或 Cmd+Option+I）
2. **切换到 Network 标签**
3. **刷新页面**
4. 检查 `PromptInput.css` 和 `App.jsx` 的加载时间应该是**当前时间**
5. 检查 CSS 文件中是否包含：
   ```css
   .prompt-input-fixed {
     position: fixed;  /* 不是 sticky */
     bottom: 24px;
   }
   ```

## 如果仍然不生效

### 方法 1：禁用缓存（开发工具）
1. 打开开发者工具（F12）
2. 切换到 **Network** 标签
3. 勾选 **Disable cache**（禁用缓存）
4. 保持开发者工具打开状态
5. 刷新页面

### 方法 2：清除浏览器缓存
**Chrome/Edge:**
1. `Cmd + Shift + Delete` (Mac) 或 `Ctrl + Shift + Delete` (Windows)
2. 选择"缓存的图片和文件"
3. 点击"清除数据"

**Safari:**
1. Safari 菜单 → 偏好设置 → 高级 → 勾选"在菜单栏中显示开发菜单"
2. 开发 → 清空缓存

### 方法 3：使用无痕模式
1. `Cmd + Shift + N` (Mac) 或 `Ctrl + Shift + N` (Windows)
2. 在无痕窗口中打开应用
3. 如果无痕模式下正常，说明是缓存问题

## 代码已确认正确

已修改的文件：
- ✅ `src/index.css` - `.main-shell { height: 100vh; }`
- ✅ `src/App.jsx` - 输入框在 `.workspace-scroll` 外
- ✅ `src/components/PromptInput.css` - `.prompt-input-fixed { position: fixed; }`
- ✅ `src/components/TimelineFeed.css` - 底部 padding 调整

## 预期效果

刷新后应该看到：
1. ✅ 输入框**立即**出现在页面底部（无需滚动）
2. ✅ 滚动页面时，输入框**保持固定位置**
3. ✅ 输入框**不随内容滚动**
4. ✅ 可以正常在输入框中打字、点击按钮

## 如果还是不对

请截图或录屏，展示：
1. 当前页面的完整视图
2. 滚动时的行为
3. 开发者工具 Console 中是否有错误
