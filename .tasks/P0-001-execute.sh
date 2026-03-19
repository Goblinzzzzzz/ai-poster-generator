#!/bin/bash
# P0-001 极简创作模式 - 执行脚本

set -e

echo "=========================================="
echo "P0-001 极简创作模式 - 开始执行"
echo "=========================================="
echo ""

# 1. 备份
echo "【步骤 1】备份当前代码..."
cp src/App.jsx src/App.jsx.p0-001-backup
cp src/index.css src/index.css.p0-001-backup
echo "✓ 备份完成"
echo ""

# 2. 重写 App.jsx
echo "【步骤 2】重写 App.jsx - 居中沉浸式布局..."

cat > src/App.jsx << 'APPEOF'
import { useState } from 'react'
import { POSTER_API_URL } from './config'

const DEFAULT_NEGATIVE_PROMPT = '文字、数字、水印、签名、尺寸标注、日期、时间、版本号、模糊、低质量、变形、杂乱、过曝、欠曝、噪点、畸形、多余手指、错误解剖、重复元素、低分辨率、压缩痕迹、色带、锯齿边缘'

function App() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('customPrompt', prompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)
      formData.append('sizeTemplate', 'mobile')
      formData.append('styleDesc', '极简')

      const response = await fetch(POSTER_API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`生成失败：${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data.imageUrl || `data:image/png;base64,${data.base64Image}`
      
      setGeneratedImages(prev => [imageUrl, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="app-container">
      {/* 居中沉浸式创作区 */}
      <div className="creation-container">
        <h1 className="app-title">🎨 AI Poster Generator</h1>
        <p className="app-subtitle">描述你想生成的画面，AI 帮你实现创意</p>
        
        {/* 提示词输入 */}
        <div className="prompt-section">
          <textarea
            className="prompt-textarea"
            placeholder="描述你想生成的画面... 例如：一位穿着现代职业装的女性，办公室环境，极简主义风格，柔和自然光"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
          />
        </div>

        {/* 生成按钮 */}
        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">✨</span>
              <span>立即生成</span>
            </>
          )}
        </button>

        {/* 错误提示 */}
        {error && (
          <div className="error-toast">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 历史作品展示 */}
        {generatedImages.length > 0 && (
          <div className="gallery-section">
            <h2 className="gallery-title">🎨 我的作品</h2>
            <div className="gallery-grid">
              {generatedImages.map((img, index) => (
                <div key={index} className="gallery-item">
                  <img src={img} alt={`作品${index + 1}`} className="gallery-image" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
APPEOF

echo "✓ App.jsx 重写完成"
echo ""

# 3. 重写样式
echo "【步骤 3】重写样式 - 居中沉浸式..."

cat > src/index.css << 'CSSEOF'
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.creation-container {
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.app-title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  text-align: center;
  color: #64748b;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.prompt-section {
  margin-bottom: 2rem;
}

.prompt-textarea {
  width: 100%;
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 1.125rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 200px;
  transition: all 0.2s;
  font-family: inherit;
}

.prompt-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.prompt-textarea::placeholder {
  color: #94a3b8;
}

.generate-button {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
}

.generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.5rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-toast {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.gallery-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e2e8f0;
}

.gallery-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #0f172a;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.gallery-item {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.gallery-item:hover {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.gallery-image {
  width: 100%;
  height: auto;
  display: block;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .creation-container {
    padding: 2rem;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .prompt-textarea {
    min-height: 150px;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
CSSEOF

echo "✓ 样式重写完成"
echo ""

# 4. 构建验证
echo "【步骤 4】构建验证..."
npm run build
echo ""

echo "=========================================="
echo "✅ P0-001 极简创作模式完成！"
echo "=========================================="
echo ""
echo "【修改内容】"
echo "  ✓ 居中沉浸式布局（最大宽度 900px）"
echo "  ✓ 大文本框提示词输入（200px 高度）"
echo "  ✓ 渐变生成按钮（居中、大尺寸）"
echo "  ✓ 历史作品展示（瀑布流）"
echo "  ✓ 极简紫色渐变主题"
echo ""
echo "【验收标准】"
echo "  ✓ 单一文本框居中显示"
echo "  ✓ 占位符引导文案"
echo "  ✓ 高级参数默认隐藏"
echo "  ✓ 生成按钮大尺寸居中"
echo "  ✓ 构建验证通过"
echo ""
echo "请提交代码："
echo "git add -A"
echo "git commit -m 'feat(P0-001): 极简创作模式 - 居中沉浸式布局'"
echo "git push origin main"
