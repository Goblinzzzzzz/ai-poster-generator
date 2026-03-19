import { useState } from 'react'
import { POSTER_API_URL } from './config'
import Navbar from './components/Navbar'

const DEFAULT_NEGATIVE_PROMPT = '文字、数字、水印、签名、尺寸标注、日期、时间、版本号、模糊、低质量、变形、杂乱、过曝、欠曝、噪点、畸形、多余手指、错误解剖、重复元素、低分辨率、压缩痕迹、色带、锯齿边缘'

const STYLE_PRESETS = [
  { id: 'realistic', name: '写实', icon: '📷' },
  { id: 'anime', name: '二次元', icon: '🎨' },
  { id: '3d', name: '3D 渲染', icon: '🎯' },
  { id: 'oil', name: '油画', icon: '🖼️' },
  { id: 'watercolor', name: '水彩', icon: '💧' },
  { id: 'cyberpunk', name: '赛博朋克', icon: '🌃' },
  { id: 'minimal', name: '极简', icon: '⚪' },
  { id: 'vintage', name: '复古', icon: '📻' },
]

const ASPECT_RATIOS = [
  { id: 'mobile', ratio: '9:16', name: '手机海报' },
  { id: 'wechat_cover', ratio: '16:9', name: '横版封面' },
  { id: 'weibo', ratio: '1:1', name: '正方形' },
  { id: 'a4', ratio: '3:4', name: 'A4 打印' },
]

const PROMPT_TEMPLATES = [
  { id: 1, text: '高质量，专业设计，现代办公室环境，简约风格，明亮均匀照明' },
  { id: 2, text: '科技感，蓝色渐变背景，未来感线条，抽象几何图形' },
  { id: 3, text: '温暖自然光，侧光营造层次感，色彩鲜艳，活力四射' },
  { id: 4, text: '高端商务风格，专业影棚布光，品牌主色，哑光质感' },
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('minimal')
  const [selectedRatio, setSelectedRatio] = useState('mobile')
  const [referenceImage, setReferenceImage] = useState(null)
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
      
      // 核心参数
      const styleDesc = STYLE_PRESETS.find(s => s.id === selectedStyle)?.name || '简约现代'
      const ratioDesc = ASPECT_RATIOS.find(r => r.id === selectedRatio)?.ratio || '9:16'
      
      // 构建完整 prompt（风格 + 用户输入）
      const finalPrompt = `${styleDesc}风格，${prompt}，比例${ratioDesc}`
      
      formData.append('customPrompt', finalPrompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)
      formData.append('sizeTemplate', selectedRatio)
      formData.append('styleDesc', styleDesc)

      // 参考图（如果有）
      if (referenceImage) {
        const reader = new FileReader()
        const readPromise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
        })
        reader.readAsDataURL(referenceImage)
        const base64 = await readPromise
        formData.append('referenceImage', base64)
      }

      const response = await fetch(POSTER_API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`生成失败：${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data.imageUrl || `data:image/png;base64,${data.base64Image}`
      
      // 添加到作品列表
      setGeneratedImages(prev => [imageUrl, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseTemplate = (templateText) => {
    setPrompt(templateText)
  }

  return (
    <div className="app-container">
      <Navbar />
      
      {/* 主内容区 - 左右分栏 */}
      <div className="main-workspace">
        {/* 左侧：提示词输入区 */}
        <div className="left-panel">
          <div className="prompt-section">
            <label className="section-label">
              <span className="label-icon">✨</span>
              <span>描述你想生成的画面</span>
            </label>
            
            <textarea
              className="prompt-textarea"
              placeholder="例如：一位穿着现代职业装的女性，办公室环境，极简主义风格，柔和自然光，三分法构图..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
            />
            
            {/* 提示词模板 */}
            <div className="prompt-templates">
              <div className="templates-label">💡 快速填充：</div>
              <div className="template-chips">
                {PROMPT_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className="template-chip"
                    onClick={() => handleUseTemplate(t.text)}
                  >
                    {t.text.slice(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
            
            {/* 参考图上传 */}
            <div className="reference-upload">
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReferenceImage(e.target.files[0])}
                  className="file-input"
                />
                <span className="upload-text">
                  📎 添加参考图 {referenceImage && `(${referenceImage.name})`}
                </span>
              </label>
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
          </div>
        </div>
        
        {/* 右侧：参数配置面板 */}
        <div className="right-panel">
          <div className="settings-section">
            <h3 className="section-title">
              <span>📐</span>
              <span>画面比例</span>
            </h3>
            <div className="ratio-grid">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.id}
                  className={`ratio-card ${selectedRatio === ratio.id ? 'active' : ''}`}
                  onClick={() => setSelectedRatio(ratio.id)}
                >
                  <div className="ratio-value">{ratio.ratio}</div>
                  <div className="ratio-name">{ratio.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h3 className="section-title">
              <span>🎨</span>
              <span>艺术风格</span>
            </h3>
            <div className="style-grid">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  className={`style-card ${selectedStyle === style.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div className="style-icon">{style.icon}</div>
                  <div className="style-name">{style.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h3 className="section-title">
              <span>⚙️</span>
              <span>高级设置</span>
            </h3>
            <div className="advanced-settings">
              <div className="setting-item">
                <span className="setting-label">负面提示词</span>
                <div className="setting-value">已配置（24 项）</div>
              </div>
              <div className="setting-item">
                <span className="setting-label">生成质量</span>
                <div className="setting-value">2K（标准）</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部：作品展示区 */}
      {generatedImages.length > 0 && (
        <div className="gallery-section">
          <h3 className="gallery-title">🎨 我的作品</h3>
          <div className="gallery-grid">
            {generatedImages.map((img, index) => (
              <div key={index} className="gallery-item">
                <img src={img} alt={`作品${index + 1}`} className="gallery-image" />
                <div className="gallery-actions">
                  <button className="action-btn">⬇️ 下载</button>
                  <button className="action-btn">🔄 同款</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
