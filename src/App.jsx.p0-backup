import { useEffect, useState } from 'react'
import { POSTER_API_URL } from './config'
import Navbar from './components/Navbar'
import PromptInput from './components/PromptInput'
import StyleSelector from './components/StyleSelector'
import AspectRatioSelector from './components/AspectRatioSelector'
import TemplateLibrary from './components/TemplateLibrary'

const ONE_MB = 1024 * 1024
const MIN_BASE64_IMAGE_LENGTH = 64
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/

// 扩展的负面提示词（对标即梦最佳实践）
const DEFAULT_NEGATIVE_PROMPT = '文字、数字、水印、签名、尺寸标注、日期、时间、版本号、模糊、低质量、变形、杂乱、过曝、欠曝、噪点、畸形、多余手指、错误解剖、重复元素、低分辨率、压缩痕迹、色带、锯齿边缘'

const STYLE_MAP = {
  realistic: '写实摄影风格',
  anime: '二次元动漫风格',
  '3d': '3D 渲染风格',
  oil: '油画风格',
  watercolor: '水彩画风格',
  cyberpunk: '赛博朋克风格',
  minimal: '极简现代风格',
  vintage: '复古怀旧风格',
}

const normalizeImageSrc = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('data:image/') || normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('blob:') || normalized.startsWith('/')) {
    return normalized
  }
  const compactValue = normalized.replace(/^base64,/, '').replace(/\s+/g, '')
  if (compactValue.length >= MIN_BASE64_IMAGE_LENGTH && BASE64_IMAGE_PATTERN.test(compactValue)) {
    return `data:image/png;base64,${compactValue}`
  }
  return ''
}

function App() {
  const [posterType, setPosterType] = useState('training')
  const [sizeTemplate, setSizeTemplate] = useState('mobile')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [style, setStyle] = useState('minimal')
  const [customPrompt, setCustomPrompt] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [referenceFile, setReferenceFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const handleUseTemplate = (template) => {
    setCustomPrompt(template.prompt)
    setShowTemplates(false)
  }

  const handleOptimizePrompt = async () => {
    // TODO: 调用 AI 优化提示词
    alert('提示词优化功能开发中...')
  }

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('posterType', posterType)
      formData.append('sizeTemplate', sizeTemplate)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      
      // 将风格选择映射为风格描述
      const styleDesc = STYLE_MAP[style] || '简约现代'
      formData.append('styleDesc', styleDesc)
      
      // 使用优化后的 prompt
      const finalPrompt = customPrompt || `${styleDesc}风格，${title || '海报设计'}，${subtitle || ''}`.trim()
      formData.append('customPrompt', finalPrompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)

      if (logoFile) {
        const logoData = await readFileAsBase64(logoFile)
        formData.append('logoImage', logoData)
      }

      if (referenceFile) {
        const refData = await readFileAsBase64(referenceFile)
        formData.append('referenceImage', refData)
      }

      const response = await fetch(POSTER_API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `生成失败：${response.status}`)
      }

      const data = await response.json()
      
      if (!data.imageUrl && !data.base64Image) {
        throw new Error('未返回图片数据')
      }

      const imageUrl = data.imageUrl || `data:image/png;base64,${data.base64Image}`
      const normalizedUrl = normalizeImageSrc(imageUrl)
      
      if (!normalizedUrl) {
        throw new Error('图片格式不正确')
      }

      setGeneratedImage(normalizedUrl)
    } catch (err) {
      console.error('生成失败:', err)
      setError(err.message || '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDownload = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `poster-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app">
      <Navbar />
      
      <main className="main-content">
        <div className="container">
          {/* 标题区 */}
          <section className="hero-section">
            <h1 className="hero-title">
              <span className="title-icon">🎨</span>
              AI 海报生成器
            </h1>
            <p className="hero-subtitle">
              输入创意描述，选择风格，一键生成专业海报
            </p>
          </section>

          {/* 提示词输入 */}
          <PromptInput
            value={customPrompt}
            onChange={setCustomPrompt}
            onUseTemplate={() => setShowTemplates(!showTemplates)}
            onOptimize={handleOptimizePrompt}
          />

          {/* 模板库（条件显示） */}
          {showTemplates && (
            <TemplateLibrary onSelect={handleUseTemplate} />
          )}

          {/* 风格选择 */}
          <StyleSelector value={style} onChange={setStyle} />

          {/* 比例选择 */}
          <AspectRatioSelector value={sizeTemplate} onChange={setSizeTemplate} />

          {/* 标题和副标题 */}
          <div className="form-section">
            <label className="form-label">海报标题</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入海报标题（可选）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="form-label">副标题</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入副标题（可选）"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          {/* 素材上传 */}
          <div className="form-section">
            <label className="form-label">🏷️ Logo 文件</label>
            <input
              type="file"
              className="file-input"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
            />
            {logoFile && <div className="file-name">已选择：{logoFile.name}</div>}
          </div>

          <div className="form-section">
            <label className="form-label">🖼️ 参考图</label>
            <input
              type="file"
              className="file-input"
              accept="image/*"
              onChange={(e) => setReferenceFile(e.target.files[0])}
            />
            {referenceFile && <div className="file-name">已选择：{referenceFile.name}</div>}
          </div>

          {/* 生成按钮 */}
          <button
            className="btn-generate"
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
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 生成结果 */}
          {generatedImage && (
            <div className="result-section">
              <h2 className="result-title">生成结果</h2>
              <div className="result-image-container">
                <img src={generatedImage} alt="生成的海报" className="result-image" />
              </div>
              <button className="btn-download" onClick={handleDownload}>
                <span className="btn-icon">⬇️</span>
                <span>下载图片</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
