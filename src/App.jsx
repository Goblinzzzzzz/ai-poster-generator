import { useState } from 'react'

// 海报类型选项
const POSTER_TYPES = [
  { id: 'training', name: '培训海报', icon: '📚', desc: '专业培训、讲座、研讨会' },
  { id: 'culture', name: '文化海报', icon: '🎭', desc: '企业文化、团队建设' },
  { id: 'brand', name: '品牌宣传', icon: '🏆', desc: '品牌推广、产品介绍' },
  { id: 'festival', name: '节日海报', icon: '🎉', desc: '节日祝福、活动庆祝' },
  { id: 'notice', name: '通知海报', icon: '📢', desc: '公告通知、重要提醒' },
]

// 尺寸模板选项
const SIZE_TEMPLATES = [
  { id: 'mobile', name: '手机海报', size: '1080×1920', desc: '微信朋友圈、微信群' },
  { id: 'a4', name: 'A4 打印', size: '2480×3508', desc: '打印张贴' },
  { id: 'wechat_cover', name: '公众号封面', size: '900×383', desc: '微信公众号' },
  { id: 'wechat_sub', name: '公众号次图', size: '900×500', desc: '微信公众号次图' },
  { id: 'weibo', name: '微博海报', size: '1000×1000', desc: '微博发布' },
]

// 风格预设选项
const STYLE_PRESETS = {
  training: ['专业严谨', '轻松活泼', '简约现代'],
  culture: ['温暖人文', '活力激情', '简约大气'],
  brand: ['高端商务', '科技感', '年轻潮流'],
  festival: ['喜庆热闹', '温馨祝福', '创意趣味'],
  notice: ['清晰醒目', '正式严肃', '简约直接'],
}

// Prompt 模板
const PROMPT_TEMPLATES = [
  '简约商务风格，留白多一些，蓝色主色调',
  '节日喜庆风格，红色为主，热闹氛围',
  '科技感，蓝色渐变背景，未来感',
  '人物突出，背景虚化，专业摄影风格',
  '文字居中，大标题，清晰醒目',
]

function App() {
  // 表单状态
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
  
  // 生成状态
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState(null)

  // 处理生成
  const handleGenerate = async () => {
    if (!title) {
      setError('请输入海报标题')
      return
    }
    
    setLoading(true)
    setError(null)
    
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
      setGeneratedImage(data.imageUrl || data.data?.imageUrl || null)
    } catch (err) {
      setError(err.message || '生成失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  // 处理下载
  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a')
      link.href = generatedImage
      const extension = generatedImage.startsWith('data:image/svg+xml') ? 'svg' : 'png'
      link.download = `海报-${Date.now()}.${extension}`
      link.click()
    }
  }

  // 处理 Logo 上传
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo 文件大小不能超过 5MB')
        return
      }
      setLogo(file)
    }
  }

  // 处理参考图上传
  const handleReferenceUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('参考图文件大小不能超过 10MB')
        return
      }
      setReferenceImage(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                AP
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI 海报生成器</h1>
                <p className="text-sm text-gray-500">一键生成专业海报</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="#studio" className="text-gray-600 hover:text-blue-600">创作</a>
              <a href="#workflow" className="text-gray-600 hover:text-blue-600">流程</a>
              <a href="#footer" className="text-gray-600 hover:text-blue-600">关于</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左侧：表单区域 */}
          <div className="space-y-6">
            {/* 海报类型选择 */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                海报类型
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {POSTER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPosterType(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      posterType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* 尺寸选择 */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📐</span>
                尺寸模板
              </h2>
              <div className="space-y-2">
                {SIZE_TEMPLATES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSizeTemplate(size.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                      sizeTemplate === size.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{size.name}</div>
                      <div className="text-xs text-gray-500">{size.desc}</div>
                    </div>
                    <div className="text-sm text-gray-600 font-mono">{size.size}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* 文案输入 */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                文案内容
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">标题 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入海报标题（最多 50 字）"
                    maxLength={50}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">{title.length}/50</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">副标题/正文</label>
                  <textarea
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="输入副标题或正文内容（最多 200 字）"
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">{subtitle.length}/200</div>
                </div>
              </div>
            </section>

            {/* 风格描述 */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                风格描述
              </h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {STYLE_PRESETS[posterType]?.map((style) => (
                    <button
                      key={style}
                      onClick={() => setStyleDesc(style)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        styleDesc === style
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={styleDesc}
                  onChange={(e) => setStyleDesc(e.target.value)}
                  placeholder="或自定义风格描述（如：简约商务风，蓝色主色调）"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </section>

            {/* 图片上传 */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🖼️</span>
                图片上传
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo <span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {logo && (
                    <div className="mt-2 text-sm text-green-600">✓ 已选择：{logo.name}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">参考图（可选）</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {referenceImage && (
                    <div className="mt-2 text-sm text-green-600">✓ 已选择：{referenceImage.name}</div>
                  )}
                </div>
              </div>
            </section>

            {/* 高级模式 */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <button
                onClick={() => setAdvancedMode(!advancedMode)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  高级模式
                </h2>
                <span className={`transform transition-transform ${advancedMode ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {advancedMode && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">自定义 Prompt</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="自定义 Prompt 将覆盖系统自动生成（最多 1000 字）"
                      maxLength={1000}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">负面 Prompt</label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="不希望出现的元素（如：不要文字、不要人物）"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Logo 位置</label>
                    <select
                      value={logoPosition}
                      onChange={(e) => setLogoPosition(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="auto">自动（推荐）</option>
                      <option value="top_left">左上角</option>
                      <option value="top_right">右上角</option>
                      <option value="bottom_left">左下角</option>
                      <option value="bottom_right">右下角</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prompt 模板</label>
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_TEMPLATES.map((template, i) => (
                        <button
                          key={i}
                          onClick={() => setCustomPrompt(template)}
                          className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          模板{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </span>
              ) : (
                '🚀 立即生成海报'
              )}
            </button>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                ❌ {error}
              </div>
            )}
          </div>

          {/* 右侧：预览区域 */}
          <div className="lg:sticky lg:top-8">
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">👁️</span>
                预览
              </h2>
              
              <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {generatedImage ? (
                  <img src={generatedImage} alt="生成的海报" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">🎨</div>
                    <div className="text-lg">填写表单后点击生成</div>
                    <div className="text-sm mt-2">预计耗时 10-30 秒</div>
                  </div>
                )}
              </div>

              {generatedImage && (
                <button
                  onClick={handleDownload}
                  className="w-full mt-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all"
                >
                  📥 下载海报
                </button>
              )}

              {/* 信息卡片 */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">海报类型</span>
                  <span className="font-medium">{POSTER_TYPES.find(t => t.id === posterType)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">尺寸</span>
                  <span className="font-medium">{SIZE_TEMPLATES.find(s => s.id === sizeTemplate)?.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">风格</span>
                  <span className="font-medium">{styleDesc || '未设置'}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer id="footer" className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded text-white font-bold flex items-center justify-center">AP</div>
                <span className="font-semibold">AI 海报生成器</span>
              </div>
              <p className="text-sm text-gray-500">用 AI 替代供应商，实现企业海报设计降本增效</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">快速链接</h3>
              <ul className="space-y-1 text-sm text-gray-500">
                <li><a href="#studio" className="hover:text-blue-600">创作工作室</a></li>
                <li><a href="#workflow" className="hover:text-blue-600">使用流程</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">技术支持</h3>
              <p className="text-sm text-gray-500">如有问题请联系管理员</p>
            </div>
          </div>
          <div className="border-t mt-6 pt-6 text-center text-sm text-gray-400">
            © 2026 AI 海报生成器 | Powered by Doubao-Seed
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
