# Task: Remove Prompt Enhancement - Use User Input Only

## Goal
Remove all prompt enhancement/optimization logic. The API should receive exactly what the user submits.

## Requirements
1. **Remove text optimization logic** in `utils/prompt-builder.js`
   - Remove the text detection pattern matching
   - Remove the "清晰文字，准确文字渲染" appending logic
   - Lines to remove: L93-107

2. **Simplify prompt logic**
   - Use `input.customPrompt` directly
   - If empty, use simple default: `${posterTypeLabel}视觉海报`
   - DO NOT fallback to `renderedPrompt.prompt` (template rendering)

## Code Changes

### File: `utils/prompt-builder.js`

**BEFORE (Lines 91-107):**
```javascript
let prompt = input.customPrompt || renderedPrompt.prompt || input.title || `${posterTypeLabel}视觉海报`;

// 检测是否包含中文文字需求
const textPattern = /(?:写着|文字[：:]\s*|包含文字|显示文字|文案[：:]\s*)(['""「」『』]|)([^'"「」『」\n]{1,20})\1/gi;
const textMatches = prompt.match(textPattern);

// 如果检测到文字需求，优化提示词
if (textMatches && textMatches.length > 0) {
  // ... (optimization logic)
  if (texts.some(t => t.length < 10)) {
    prompt += '，清晰文字，准确文字渲染';
  }
}
```

**AFTER:**
```javascript
// Use user input directly, no modification
let prompt = input.customPrompt || input.title || `${posterTypeLabel}视觉海报`;
```

## Verification
- Run `npm run build` to verify syntax
- Check that no prompt enhancement is applied

## Summary
- Remove lines L93-107 (text optimization logic)
- Simplify prompt assignment (remove `renderedPrompt.prompt` fallback)
- Result: API receives exactly what user submits
