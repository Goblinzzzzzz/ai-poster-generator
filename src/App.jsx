import { useEffect, useState } from 'react'

// API 端点配置：优先使用环境变量，回退到相对路径（Railway 生产环境）
const API_ENDPOINT = import.meta.env.VITE_POSTER_API_URL || '/api/generate'
const ONE_MB = 1024 * 1024
const MIN_BASE64_IMAGE_LENGTH = 64
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/

const POSTER_TYPES = [
  { id: 'training', name: '培训海报', icon: '📚', desc: '专业培训、讲座、研讨会' },
  { id: 'culture', name: '文化海报', icon: '🎭', desc: '企业文化、团队建设' },
  { id: 'brand', name: '品牌宣传', icon: '🏆', desc: '品牌推广、产品介绍' },
  { id: 'festival', name: '节日海报', icon: '🎉', desc: '节日祝福、活动庆祝' },
  { id: 'notice', name: '通知海报', icon: '📢', desc: '公告通知、重要提醒' },
]

const SIZE_TEMPLATES = [
  { id: 'mobile', name: '手机海报', size: '1080×1920', desc: '微信朋友圈、微信群' },
  { id: 'a4', name: 'A4 打印', size: '2480×3508', desc: '打印张贴' },
  { id: 'wechat_cover', name: '公众号封面', size: '900×383', desc: '微信公众号' },
  { id: 'wechat_sub', name: '公众号次图', size: '900×500', desc: '微信公众号次图' },
  { id: 'weibo', name: '微博海报', size: '1000×1000', desc: '微博发布' },
]

const STYLE_PRESETS = {
  training: ['专业严谨', '轻松活泼', '简约现代'],
  culture: ['温暖人文', '活力激情', '简约大气'],
  brand: ['高端商务', '科技感', '年轻潮流'],
  festival: ['喜庆热闹', '温馨祝福', '创意趣味'],
  notice: ['清晰醒目', '正式严肃', '简约直接'],
}

const PROMPT_TEMPLATES = [
  '简约商务风格，留白多一些，蓝色主色调',
  '节日喜庆风格，红色为主，热闹氛围',
  '科技感，蓝色渐变背景，未来感',
  '人物突出，背景虚化，专业摄影风格',
  '文字居中，大标题，清晰醒目',
]

const WORKFLOW_STEPS = [
  {
    title: '配置创意参数',
    desc: '选择海报类型、版式尺寸和品牌视觉方向，快速搭建基础创意框架。',
  },
  {
    title: '上传品牌素材',
    desc: '添加 Logo 与参考图，帮助模型理解品牌调性并控制最终画面细节。',
  },
  {
    title: '生成并交付',
    desc: '数秒内得到高质量海报预览，确认无误后直接下载成品投入使用。',
  },
]

const PREVIEW_ASPECTS = {
  mobile: '1080 / 1920',
  a4: '2480 / 3508',
  wechat_cover: '900 / 383',
  wechat_sub: '900 / 500',
  weibo: '1 / 1',
}

const UPLOAD_RULES = {
  logo: {
    limit: 5 * ONE_MB,
    label: 'Logo 文件',
    error: 'Logo 文件大小不能超过 5MB',
  },
  referenceImage: {
    limit: 10 * ONE_MB,
    label: '参考图',
    error: '参考图文件大小不能超过 10MB',
  },
}

const normalizeImageSrc = (value) => {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return ''
  }

  if (
    normalized.startsWith('data:image/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('/')
  ) {
    return normalized
  }

  const compactValue = normalized.replace(/^base64,/, '').replace(/\s+/g, '')

  if (compactValue.length >= MIN_BASE64_IMAGE_LENGTH && BASE64_IMAGE_PATTERN.test(compactValue)) {
    return `data:image/png;base64,${compactValue}`
  }

  return ''
}

const inferFileExtension = (value) => {
  const normalized = String(value || '').trim()

  if (normalized.startsWith('data:image/')) {
    const mimeType = normalized.slice('data:'.length, normalized.indexOf(';'))
    return mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  }

  try {
    const pathname = new URL(normalized, window.location.origin).pathname
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/)
    return match?.[1]?.toLowerCase() || 'png'
  } catch {
    return 'png'
  }
}

const normalizeMessage = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/\s+/g, ' ').slice(0, 300)
}

const parseJsonSafely = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const extractApiErrorMessage = ({ payload, rawText, status, statusText }) => {
  const messageCandidates = [
    payload?.error?.message,
    typeof payload?.error?.details === 'string' ? payload.error.details : '',
    payload?.message,
    payload?.detail,
    rawText,
  ]
  const message = messageCandidates.map(normalizeMessage).find(Boolean)

  if (message && !message.startsWith('<')) {
    return message
  }

  if (status === 413) {
    return '上传文件过大，请压缩图片后重试。'
  }

  if (status >= 500) {
    return `生成服务暂时不可用（${status}），请稍后重试。`
  }

  const statusLabel = [status, normalizeMessage(statusText)].filter(Boolean).join(' ')
  return `生成请求失败（${statusLabel}），请检查填写内容后重试。`
}

const normalizeRequestErrorMessage = (error) => {
  if (error?.name === 'AbortError') {
    return '生成请求超时，请稍后重试。'
  }

  if (error instanceof TypeError) {
    return '无法连接到生成服务，请检查网络连接后重试。'
  }

  return normalizeMessage(error?.message) || '生成失败，请稍后重试。'
}

function App() {
  const [posterType, setPosterType] = useState('training')
  const [sizeTemplate, setSizeTemplate] = useState('mobile')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [styleDesc, setStyleDesc] = useState('')
  const [logo, setLogo] = useState(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [logoPosition, setLogoPosition] = useState('auto')

  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [previewReady, setPreviewReady] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [toast, setToast] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)

  const selectedPosterType = POSTER_TYPES.find((type) => type.id === posterType)
  const selectedSizeTemplate = SIZE_TEMPLATES.find((size) => size.id === sizeTemplate)
  const titleError = error === '请输入海报标题'

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 4200)

    return () => window.clearTimeout(timeout)
  }, [toast])

  const showError = (message, titleText = '生成异常') => {
    setError(message)
    setSuccessMessage(null)
    setToast({
      id: Date.now(),
      title: titleText,
      message,
    })
  }

  const clearFeedback = () => {
    setError(null)
    setToast(null)
  }

  const applyUploadedFile = (kind, file) => {
    if (!file) {
      return
    }

    const rule = UPLOAD_RULES[kind]

    if (!rule) {
      return
    }

    if (file.size > rule.limit) {
      showError(rule.error, `${rule.label}上传失败`)
      return
    }

    clearFeedback()

    if (kind === 'logo') {
      setLogo(file)
      return
    }

    setReferenceImage(file)
  }

  const handleFileChange = (kind) => (event) => {
    const file = event.target.files?.[0]
    applyUploadedFile(kind, file)
    event.target.value = ''
  }

  const handleDragEnter = (kind) => (event) => {
    event.preventDefault()
    setDragTarget(kind)
  }

  const handleDragLeave = (kind) => (event) => {
    event.preventDefault()

    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
      return
    }

    setDragTarget((current) => (current === kind ? null : current))
  }

  const handleDragOver = (kind) => (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragTarget(kind)
  }

  const handleDrop = (kind) => (event) => {
    event.preventDefault()
    setDragTarget(null)
    const file = event.dataTransfer.files?.[0]
    applyUploadedFile(kind, file)
  }

  const handleGenerate = async () => {
    if (!title.trim()) {
      showError('请输入海报标题', '表单校验失败')
      return
    }

    setLoading(true)
    setGeneratedImage('')
    setPreviewReady(false)
    clearFeedback()
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append('posterType', posterType)
      formData.append('sizeTemplate', sizeTemplate)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('styleDesc', styleDesc)
      formData.append('customPrompt', customPrompt)
      formData.append('negativePrompt', negativePrompt)
      formData.append('logoPosition', logoPosition)

      if (logo) formData.append('logo', logo)
      if (referenceImage) formData.append('referenceImage', referenceImage)

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      })
      const rawText = await response.text()
      const payload = parseJsonSafely(rawText)

      if (!response.ok) {
        throw new Error(
          extractApiErrorMessage({
            payload,
            rawText,
            status: response.status,
            statusText: response.statusText,
          }),
        )
      }

      const nextImage = normalizeImageSrc(
        payload?.imageUrl || payload?.data?.imageUrl || payload?.data?.b64_json || '',
      )

      if (!nextImage) {
        throw new Error('Doubao 返回了空图片，请重试')
      }

      setGeneratedImage(nextImage)
      setPreviewReady(false)
      setSuccessMessage('海报生成成功，可直接预览或下载。')
    } catch (err) {
      setGeneratedImage('')
      setPreviewReady(false)
      showError(normalizeRequestErrorMessage(err), '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) {
      return
    }

    const fileExtension = inferFileExtension(generatedImage)
    const fileName = `海报-${Date.now()}.${fileExtension}`

    try {
      const response = await fetch(generatedImage)

      if (!response.ok) {
        throw new Error('下载资源获取失败')
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch {
      const link = document.createElement('a')
      link.href = generatedImage
      link.download = fileName
      link.click()
    }

    setSuccessMessage('下载已开始，请查看浏览器下载列表。')
  }

  const handlePreviewError = () => {
    setGeneratedImage('')
    setPreviewReady(false)
    showError('生成结果无法预览，请重新生成。')
  }

  return (
    <div className="app-shell">
      <div className="app-bg-orb app-bg-orb-left" />
      <div className="app-bg-orb app-bg-orb-right" />

      {toast && (
        <div className="toast-stack">
          <div className="toast-card toast-card-error" role="alert" aria-live="assertive">
            <div className="toast-card-copy">
              <strong>{toast.title}</strong>
              <span>{toast.message}</span>
            </div>
            <button type="button" onClick={() => setToast(null)} className="toast-dismiss" aria-label="关闭提示">
              ×
            </button>
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="shell-container topbar-inner">
          <a href="#studio" className="brand-lockup" aria-label="AI 海报生成器">
            <span className="brand-mark">AP</span>
            <span>
              <strong>AI 海报生成器</strong>
              <small>Professional poster studio</small>
            </span>
          </a>

          <nav className="topnav">
            <a href="#studio" className="nav-chip">创作中心</a>
            <a href="#workflow" className="nav-chip">使用流程</a>
            <a href="#footer" className="nav-chip">关于产品</a>
          </nav>
        </div>
      </header>

      <main className="shell-container app-main">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="hero-badge">AI DESIGN STUDIO</span>
            <h1>将品牌海报生产流程压缩到一次提交。</h1>
            <p>
              以 SaaS 工作台方式组织你的文案、尺寸、素材和 Prompt 配置。
              保持流程清晰，同时让最终画面更专业、更稳定。
            </p>

            <div className="hero-metrics">
              <div className="metric-tile">
                <strong>5+</strong>
                <span>预置海报场景</span>
              </div>
              <div className="metric-tile">
                <strong>10-30s</strong>
                <span>平均生成时长</span>
              </div>
              <div className="metric-tile">
                <strong>Ready</strong>
                <span>支持直接下载交付</span>
              </div>
            </div>
          </div>

          <div className="hero-side-panel">
            <div className="hero-side-label">当前配置</div>
            <div className="hero-side-value">{selectedPosterType?.name}</div>
            <div className="hero-side-meta">
              <span>{selectedSizeTemplate?.size}</span>
              <span>{styleDesc || '待设置风格'}</span>
            </div>
            <div className="hero-side-note">
              使用左侧工作台完成配置，右侧实时查看生成结果与交付状态。
            </div>
          </div>
        </section>

        <section id="studio" className="studio-grid">
          <div className="studio-column">
            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">01</span>
                  <h2>选择海报方向</h2>
                </div>
                <p>先定义内容场景与输出尺寸，后续生成结果会更稳定。</p>
              </div>

              <div className="type-grid">
                {POSTER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPosterType(type.id)}
                    className={`select-card ${posterType === type.id ? 'select-card-active' : ''}`}
                  >
                    <span className="select-card-icon">{type.icon}</span>
                    <strong>{type.name}</strong>
                    <small>{type.desc}</small>
                  </button>
                ))}
              </div>

              <div className="size-list">
                {SIZE_TEMPLATES.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSizeTemplate(size.id)}
                    className={`size-card ${sizeTemplate === size.id ? 'size-card-active' : ''}`}
                  >
                    <span>
                      <strong>{size.name}</strong>
                      <small>{size.desc}</small>
                    </span>
                    <em>{size.size}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">02</span>
                  <h2>编辑文案与风格</h2>
                </div>
                <p>通过标题、正文和风格标签组合出更清晰的视觉意图。</p>
              </div>

              <div className="field-stack">
                <label className="field-group">
                  <span className="field-label">
                    标题
                    <b>*</b>
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="输入海报标题（最多 50 字）"
                    maxLength={50}
                    className={`field-input ${titleError ? 'field-input-error' : title ? 'field-input-success' : ''}`}
                  />
                  <span className="field-meta">{title.length}/50</span>
                </label>

                <label className="field-group">
                  <span className="field-label">副标题/正文</span>
                  <textarea
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="输入副标题或正文内容（最多 200 字）"
                    maxLength={200}
                    rows={4}
                    className="field-input field-textarea"
                  />
                  <span className="field-meta">{subtitle.length}/200</span>
                </label>

                <div className="field-group">
                  <span className="field-label">风格预设</span>
                  <div className="chip-row">
                    {STYLE_PRESETS[posterType]?.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setStyleDesc(style)}
                        className={`choice-chip ${styleDesc === style ? 'choice-chip-active' : ''}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field-group">
                  <span className="field-label">自定义风格描述</span>
                  <input
                    type="text"
                    value={styleDesc}
                    onChange={(event) => setStyleDesc(event.target.value)}
                    placeholder="如：简约商务风，蓝色主色调"
                    className="field-input"
                  />
                </label>
              </div>
            </section>

            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">03</span>
                  <h2>上传品牌素材</h2>
                </div>
                <p>上传素材可帮助模型更好地对齐品牌识别与视觉质感，Logo 与参考图均为可选。</p>
              </div>

              <div className="upload-grid">
                <label
                  className={`upload-card ${logo ? 'upload-card-complete' : ''} ${dragTarget === 'logo' ? 'upload-card-dragging' : ''}`}
                  onDragEnter={handleDragEnter('logo')}
                  onDragLeave={handleDragLeave('logo')}
                  onDragOver={handleDragOver('logo')}
                  onDrop={handleDrop('logo')}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange('logo')}
                    className="sr-only"
                  />
                  <span className="upload-badge upload-badge-optional">{logo ? '已上传' : '可选'}</span>
                  <strong>Logo 文件（可选）</strong>
                  <small>支持 PNG / JPG，大小不超过 5MB。可拖拽到此处上传。</small>
                  <span className="upload-file">{logo ? logo.name : '点击选择品牌 Logo（可选）'}</span>
                </label>

                <label
                  className={`upload-card ${referenceImage ? 'upload-card-complete' : ''} ${dragTarget === 'referenceImage' ? 'upload-card-dragging' : ''}`}
                  onDragEnter={handleDragEnter('referenceImage')}
                  onDragLeave={handleDragLeave('referenceImage')}
                  onDragOver={handleDragOver('referenceImage')}
                  onDrop={handleDrop('referenceImage')}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange('referenceImage')}
                    className="sr-only"
                  />
                  <span className="upload-badge upload-badge-optional">可选</span>
                  <strong>参考图（可选）</strong>
                  <small>支持 PNG / JPG，大小不超过 10MB。可拖拽到此处上传。</small>
                  <span className="upload-file">
                    {referenceImage ? referenceImage.name : '上传参考图辅助控制风格（可选）'}
                  </span>
                </label>
              </div>
            </section>

            <section className="surface-card">
              <button
                type="button"
                onClick={() => setAdvancedMode(!advancedMode)}
                className="advanced-toggle"
              >
                <span>
                  <span className="section-kicker">04</span>
                  <strong>高级配置</strong>
                  <small>控制 Prompt、负面词与 Logo 摆放策略</small>
                </span>
                <span className={`advanced-arrow ${advancedMode ? 'advanced-arrow-open' : ''}`}>
                  ▾
                </span>
              </button>

              {advancedMode && (
                <div className="advanced-panel">
                  <label className="field-group">
                    <span className="field-label">自定义 Prompt</span>
                    <textarea
                      value={customPrompt}
                      onChange={(event) => setCustomPrompt(event.target.value)}
                      placeholder="自定义 Prompt 将覆盖系统自动生成（最多 1000 字）"
                      maxLength={1000}
                      rows={4}
                      className="field-input field-textarea"
                    />
                    <span className="field-meta">{customPrompt.length}/1000</span>
                  </label>

                  <label className="field-group">
                    <span className="field-label">负面 Prompt</span>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(event) => setNegativePrompt(event.target.value)}
                      placeholder="如：不要文字、不要人物、不要低清晰度"
                      className="field-input"
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">Logo 位置</span>
                    <select
                      value={logoPosition}
                      onChange={(event) => setLogoPosition(event.target.value)}
                      className="field-input field-select"
                    >
                      <option value="auto">自动（推荐）</option>
                      <option value="top_left">左上角</option>
                      <option value="top_right">右上角</option>
                      <option value="bottom_left">左下角</option>
                      <option value="bottom_right">右下角</option>
                    </select>
                  </label>

                  <div className="field-group">
                    <span className="field-label">快速模板</span>
                    <div className="chip-row">
                      {PROMPT_TEMPLATES.map((template, index) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => setCustomPrompt(template)}
                          className="template-chip"
                        >
                          模板 {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="action-card">
              <div className="action-copy">
                <h3>准备生成</h3>
                <p>系统会根据你当前的配置创建海报成品，并在右侧返回预览图。</p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className={`primary-cta ${loading ? 'primary-cta-loading' : ''}`}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-spinner" />
                    生成中...
                  </>
                ) : (
                  '立即生成海报'
                )}
              </button>

              {successMessage && !error && (
                <div className="alert-banner alert-success" role="status">
                  <strong>操作成功</strong>
                  <span>{successMessage}</span>
                </div>
              )}
            </section>
          </div>

          <aside className="preview-column">
            <section className="preview-card">
              <div className="preview-header">
                <div>
                  <span className="section-kicker">LIVE PREVIEW</span>
                  <h2>生成结果预览</h2>
                </div>
                <span className={`status-pill ${loading ? 'status-pill-busy' : generatedImage ? 'status-pill-ready' : ''}`}>
                  {loading ? 'Rendering' : generatedImage ? 'Completed' : 'Waiting'}
                </span>
              </div>

              <div
                className="preview-stage"
                style={{ '--preview-aspect': PREVIEW_ASPECTS[sizeTemplate] || PREVIEW_ASPECTS.mobile }}
              >
                {loading ? (
                  <div className="preview-loading">
                    <div className="preview-glow" />
                    <div className="preview-skeleton preview-skeleton-title" />
                    <div className="preview-skeleton preview-skeleton-line" />
                    <div className="preview-skeleton preview-skeleton-line short" />
                    <div className="preview-skeleton preview-skeleton-footer" />
                  </div>
                ) : generatedImage ? (
                  <div className={`preview-frame ${previewReady ? 'preview-frame-ready' : ''}`}>
                    {!previewReady && (
                      <div className="preview-image-loading">
                        <span className="preview-loader-ring" />
                        <span>海报载入中...</span>
                      </div>
                    )}
                    <img
                      src={generatedImage}
                      alt="生成的海报"
                      className={`preview-image ${previewReady ? 'preview-image-visible' : ''}`}
                      onLoad={() => setPreviewReady(true)}
                      onError={handlePreviewError}
                    />
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <span className="preview-placeholder-icon">✦</span>
                    <strong>海报预览将在这里出现</strong>
                    <p>填写左侧表单并开始生成，系统通常会在 10-30 秒内返回结果。</p>
                  </div>
                )}
              </div>

              <div className="preview-summary">
                <div className="summary-row">
                  <span>海报类型</span>
                  <strong>{selectedPosterType?.name}</strong>
                </div>
                <div className="summary-row">
                  <span>尺寸规格</span>
                  <strong>{selectedSizeTemplate?.size}</strong>
                </div>
                <div className="summary-row">
                  <span>风格描述</span>
                  <strong>{styleDesc || '未设置'}</strong>
                </div>
              </div>

              {generatedImage && (
                <button type="button" onClick={handleDownload} className="secondary-cta">
                  下载海报
                </button>
              )}
            </section>

            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">OUTPUT CHECK</span>
                  <h2>交付建议</h2>
                </div>
                <p>生成完成后，建议优先检查以下关键项，避免返工。</p>
              </div>

              <div className="checklist">
                <div className="checklist-item">
                  <strong>文案层级</strong>
                  <span>确认标题是否足够醒目，正文是否有足够留白与可读性。</span>
                </div>
                <div className="checklist-item">
                  <strong>品牌一致性</strong>
                  <span>检查 Logo 位置、品牌色和彩页调性是否与实际品牌规范匹配。</span>
                </div>
                <div className="checklist-item">
                  <strong>投放适配</strong>
                  <span>根据输出尺寸确认内容裁切范围，避免在移动端或打印场景中被遮挡。</span>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section id="workflow" className="workflow-grid">
          {WORKFLOW_STEPS.map((step, index) => (
            <article key={step.title} className="workflow-card">
              <span className="workflow-index">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </section>
      </main>

      <footer id="footer" className="footer-wrap">
        <div className="shell-container footer-card">
          <div>
            <div className="brand-lockup footer-brand">
              <span className="brand-mark">AP</span>
              <span>
                <strong>AI 海报生成器</strong>
                <small>为企业内部设计流程提供高效 AI 工作台</small>
              </span>
            </div>
            <p className="footer-copy">
              用统一的创作界面管理素材、文案与生成结果，让海报生产流程更可控。
            </p>
          </div>

          <div className="footer-links">
            <a href="#studio">创作中心</a>
            <a href="#workflow">使用流程</a>
            <a href="#footer">技术支持</a>
          </div>

          <div className="footer-meta">© 2026 AI 海报生成器 | Powered by Doubao-Seed</div>
        </div>
      </footer>
    </div>
  )
}

export default App
