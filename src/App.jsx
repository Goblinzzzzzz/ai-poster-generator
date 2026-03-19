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
