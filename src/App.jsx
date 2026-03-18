import { useState } from 'react'

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
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const selectedPosterType = POSTER_TYPES.find((type) => type.id === posterType)
  const selectedSizeTemplate = SIZE_TEMPLATES.find((size) => size.id === sizeTemplate)
  const titleError = error === '请输入海报标题'

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('请输入海报标题')
      setSuccessMessage(null)
      return
    }

    setLoading(true)
    setError(null)
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

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.error?.message || '生成失败，请稍后重试')
      }

      const data = await response.json()
      const imageUrl = data.imageUrl || data.data?.imageUrl || null
      setGeneratedImage(imageUrl)
      setSuccessMessage(imageUrl ? '海报生成成功，可直接预览或下载。' : '任务已完成。')
    } catch (err) {
      setError(err.message || '生成失败，请检查网络连接')
      setSuccessMessage(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a')
      link.href = generatedImage
      const extension = generatedImage.startsWith('data:image/svg+xml') ? 'svg' : 'png'
      link.download = `海报-${Date.now()}.${extension}`
      link.click()
      setSuccessMessage('下载已开始，请查看浏览器下载列表。')
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo 文件大小不能超过 5MB')
        setSuccessMessage(null)
        return
      }

      setLogo(file)
      setError(null)
    }
  }

  const handleReferenceUpload = (e) => {
    const file = e.target.files[0]

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('参考图文件大小不能超过 10MB')
        setSuccessMessage(null)
        return
      }

      setReferenceImage(file)
      setError(null)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-bg-orb app-bg-orb-left" />
      <div className="app-bg-orb app-bg-orb-right" />

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
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入海报标题（最多 50 字）"
                    maxLength={50}
                    className={`field-input ${titleError ? 'field-input-error' : ''}`}
                  />
                  <span className="field-meta">{title.length}/50</span>
                </label>

                <label className="field-group">
                  <span className="field-label">副标题/正文</span>
                  <textarea
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
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
                    onChange={(e) => setStyleDesc(e.target.value)}
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
                <p>上传素材可帮助模型更好地对齐品牌识别与视觉质感。</p>
              </div>

              <div className="upload-grid">
                <label className={`upload-card ${logo ? 'upload-card-complete' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                  <span className="upload-badge">{logo ? '已上传' : '必填'}</span>
                  <strong>Logo 文件</strong>
                  <small>支持 PNG / JPG，大小不超过 5MB</small>
                  <span className="upload-file">{logo ? logo.name : '点击选择品牌 Logo'}</span>
                </label>

                <label className={`upload-card ${referenceImage ? 'upload-card-complete' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    className="sr-only"
                  />
                  <span className="upload-badge upload-badge-optional">可选</span>
                  <strong>参考图</strong>
                  <small>支持 PNG / JPG，大小不超过 10MB</small>
                  <span className="upload-file">
                    {referenceImage ? referenceImage.name : '上传参考图辅助控制风格'}
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
                      onChange={(e) => setCustomPrompt(e.target.value)}
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
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="如：不要文字、不要人物、不要低清晰度"
                      className="field-input"
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">Logo 位置</span>
                    <select
                      value={logoPosition}
                      onChange={(e) => setLogoPosition(e.target.value)}
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

              {error && (
                <div className="alert-banner alert-error">
                  <strong>生成异常</strong>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && !error && (
                <div className="alert-banner alert-success">
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
                <span className={`status-pill ${loading ? 'status-pill-busy' : ''}`}>
                  {loading ? 'Rendering' : generatedImage ? 'Completed' : 'Waiting'}
                </span>
              </div>

              <div className="preview-stage">
                {loading ? (
                  <div className="preview-loading">
                    <div className="preview-glow" />
                    <div className="preview-skeleton preview-skeleton-title" />
                    <div className="preview-skeleton preview-skeleton-line" />
                    <div className="preview-skeleton preview-skeleton-line short" />
                    <div className="preview-skeleton preview-skeleton-footer" />
                  </div>
                ) : generatedImage ? (
                  <img src={generatedImage} alt="生成的海报" className="preview-image" />
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
