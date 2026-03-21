import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Lightbox from './components/Lightbox'
import MobileNav from './components/MobileNav'
import Sidebar from './components/Sidebar'
import TimelineFeed from './components/TimelineFeed'
import TopBar from './components/TopBar'
import PromptInput from './components/PromptInput'
import { POSTER_API_URL } from './config'
import { downloadWorkImage } from './utils/download'

const DEFAULT_NEGATIVE_PROMPT =
  '文字、数字、水印、签名、尺寸标注、模糊、低清晰度、杂乱、过曝、欠曝、噪点、重复元素、压缩痕迹、锯齿边缘'
const MIN_BASE64_IMAGE_LENGTH = 64
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/
const EMPTY_STATE_SUGGESTIONS = [
  '高端护肤产品海报，玻璃器皿，柔和晨光，冷白配色，极简留白。',
  '精品咖啡新品海报，桌面微距，奶泡与银色勺子形成 S 曲线，杂志封面视角。',
  '城市轻户外运动大片，晨跑女性穿过玻璃长廊，蓝白色块，海报感排版。',
]
const SENSITIVE_ERROR_PATTERN =
  /sensitive|敏感|内容安全|审核|contain sensitive information/i

const NAV_ITEMS = [
  {
    id: 'inspiration',
    label: '灵感',
    description: '收集风格与构图线索',
  },
  {
    id: 'generate',
    label: '生成',
    description: '聚焦最近的创作产出',
  },
  {
    id: 'assets',
    label: '资产',
    description: '沉淀素材、包装与模板',
  },
  {
    id: 'canvas',
    label: '画布',
    description: '查看版式与延展草稿',
  },
]

const QUICK_ACTIONS = [
  { id: 'agent', label: 'Agent 模式' },
  { id: 'auto', label: '自动' },
  { id: 'search', label: '灵感搜索' },
  { id: 'design', label: '创意设计' },
]

const DEFAULT_GENERATION_PREFERENCES = Object.freeze({
  aspectRatio: 'mobile',
  clarity: 'auto',
  autoEnhance: true,
})

const SIZE_TEMPLATE_META = {
  mobile: {
    label: '9:16',
    aspectRatio: '9 / 16',
  },
  wechat_cover: {
    label: '16:9',
    aspectRatio: '16 / 9',
  },
  weibo: {
    label: '1:1',
    aspectRatio: '1 / 1',
  },
  a4: {
    label: '3:4',
    aspectRatio: '3 / 4',
  },
}

const CLARITY_STYLE_HINTS = {
  auto: '清晰度自动平衡',
  standard: '标准清晰度',
  high: '高清细节表现',
}

const MAX_REFERENCE_IMAGE_SIZE = 10 * 1024 * 1024

const MOBILE_NAV_ITEMS = NAV_ITEMS

const TIME_FILTER_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '近 7 天' },
  { value: 'month', label: '近 30 天' },
]



const TIME_BUCKET_DAY_OFFSETS = {
  today: 0,
  yesterday: -1,
  week: -7,
  month: -30,
}

const ERROR_COPY = {
  validation: {
    title: '请输入创作描述',
    message: '请先输入提示词，再开始生成。',
    retryable: false,
  },
  sensitive: {
    title: '内容需要调整',
    message: '输入内容包含敏感词汇，请修改后重试。',
    hint: '建议保留主体、材质、光线和构图，删去可能触发审核的描述。',
    retryable: false,
  },
  network: {
    title: '网络连接失败',
    message: '网络连接失败，请检查网络后重试。',
    retryable: true,
  },
  api: {
    title: '生成服务暂时不可用',
    message: '生成服务暂时不可用，请稍后重试。',
    retryable: true,
  },
  other: {
    title: '生成失败',
    message: '生成失败，请稍后重试。',
    retryable: false,
  },
  download: {
    title: '下载失败',
    message: '下载失败，请稍后重试。',
    retryable: false,
  },
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

const buildTitleFromPrompt = (prompt) => {
  const normalizedPrompt = String(prompt || '').trim().replace(/\s+/g, ' ')

  if (!normalizedPrompt) {
    return ''
  }

  return normalizedPrompt.split(/[，。！？,.!?\n]/)[0].slice(0, 50) || normalizedPrompt.slice(0, 50)
}

const formatWorkTime = (date = new Date()) =>
  date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const createAppError = (type, overrides = {}) => {
  const preset = ERROR_COPY[type] || ERROR_COPY.other

  return {
    type,
    title: overrides.title || preset.title,
    message: overrides.message || preset.message,
    hint: overrides.hint || preset.hint || '',
    retryable:
      typeof overrides.retryable === 'boolean' ? overrides.retryable : preset.retryable,
    retryPrompt: overrides.retryPrompt || '',
  }
}

const createResponseError = ({ payload, rawText, status, statusText }) => {
  const messageCandidates = [
    payload?.error?.message,
    typeof payload?.error?.details === 'string' ? payload.error.details : '',
    payload?.message,
    payload?.detail,
    rawText,
  ]
  const message = messageCandidates.map(normalizeMessage).find(Boolean)

  if (message && !message.startsWith('<') && SENSITIVE_ERROR_PATTERN.test(message)) {
    const error = new Error(ERROR_COPY.sensitive.message)
    error.type = 'sensitive'
    error.retryable = false
    return error
  }

  if (status >= 500) {
    const error = new Error(ERROR_COPY.api.message)
    error.type = 'api'
    error.retryable = true
    return error
  }

  if (status === 429) {
    const error = new Error('生成请求过于频繁，请稍后重试。')
    error.type = 'api'
    error.retryable = true
    return error
  }

  const fallbackMessage =
    message && !message.startsWith('<')
      ? message
      : `生成失败（${status} ${normalizeMessage(statusText)}）。`
  const error = new Error(fallbackMessage)
  error.type = 'other'
  error.retryable = false
  return error
}

const normalizeRequestError = (requestError, prompt = '') => {
  if (requestError instanceof TypeError) {
    return createAppError('network', { retryPrompt: prompt })
  }

  const errorType = requestError?.type

  if (errorType === 'sensitive') {
    return createAppError('sensitive', { retryPrompt: prompt })
  }

  if (errorType === 'api') {
    return createAppError('api', {
      message: normalizeMessage(requestError?.message) || ERROR_COPY.api.message,
      retryPrompt: prompt,
      retryable: true,
    })
  }

  const message = normalizeMessage(requestError?.message)

  if (message && SENSITIVE_ERROR_PATTERN.test(message)) {
    return createAppError('sensitive', { retryPrompt: prompt })
  }

  return createAppError('other', {
    message: message || ERROR_COPY.other.message,
    retryPrompt: prompt,
  })
}

const matchesTimeFilter = (work, filterValue) => {
  if (filterValue === 'all') {
    return true
  }

  if (filterValue === 'today') {
    return work.timeBucket === 'today'
  }

  if (filterValue === 'week') {
    return ['today', 'yesterday', 'week'].includes(work.timeBucket)
  }

  return ['today', 'yesterday', 'week', 'month'].includes(work.timeBucket)
}

const matchesSearch = (work, query) => {
  if (!query) {
    return true
  }

  const normalizedQuery = query.trim().toLowerCase()
  const searchableText = [
    work.prompt,
    work.headline,
    work.author,
    work.actionType,
    work.mediaType,
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}

const buildStyleDescriptor = (quickAction, preferences) => {
  const clarityHint = CLARITY_STYLE_HINTS[preferences.clarity] || CLARITY_STYLE_HINTS.auto
  const autoHint = preferences.autoEnhance ? '自动优化构图与光效' : '减少自动润色'

  return `极简白色卡片式海报，${quickAction.label}，${clarityHint}，${autoHint}`
}

const createGeneratingWork = (prompt, quickAction, requestOptions) => {
  const now = new Date()
  const sortTimestamp = now.getTime()
  const selectedSizeTemplate =
    SIZE_TEMPLATE_META[requestOptions.preferences.aspectRatio] || SIZE_TEMPLATE_META.mobile

  return {
    id: `generated-${sortTimestamp}`,
    status: 'generating',
    view: 'generate',
    dateLabel: '今天',
    timeBucket: 'today',
    createdAt: formatWorkTime(now),
    author: '你',
    avatar: 'ME',
    prompt,
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '生成',
    headline: buildTitleFromPrompt(prompt) || '即时创作',
    tone: `${quickAction.label} · 生成中`,
    sortTimestamp,
    surface:
      'linear-gradient(160deg, #f8fbff 0%, #ebf2ff 48%, #d9e7ff 100%)',
    aspectRatio: selectedSizeTemplate.aspectRatio,
    requestOptions,
  }
}

const createGeneratedWork = (pendingWork, imageSrc, quickAction) => ({
  ...pendingWork,
  status: 'ready',
  imageSrc,
  tone: `${quickAction.label} · 最新生成`,
})

const resolveWorkTimestamp = (work) => {
  if (typeof work.sortTimestamp === 'number') {
    return work.sortTimestamp
  }

  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const absoluteDateMatch = String(work.dateLabel || '').match(
    /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
  )

  if (absoluteDateMatch) {
    const [, year, month, day] = absoluteDateMatch
    baseDate.setFullYear(Number(year), Number(month) - 1, Number(day))
  } else if (work.dateLabel === '昨天') {
    baseDate.setDate(baseDate.getDate() - 1)
  } else if (work.dateLabel !== '今天') {
    const offset = TIME_BUCKET_DAY_OFFSETS[work.timeBucket] ?? -365
    baseDate.setDate(baseDate.getDate() + offset)
  }

  const timeMatch = String(work.createdAt || '').match(/^(\d{1,2}):(\d{2})$/)
  const hours = timeMatch ? Number(timeMatch[1]) : 0
  const minutes = timeMatch ? Number(timeMatch[2]) : 0

  baseDate.setHours(hours, minutes, 0, 0)
  return baseDate.getTime()
}

const compareWorksByTime = (left, right) => {
  const difference = resolveWorkTimestamp(right) - resolveWorkTimestamp(left)

  if (difference !== 0) {
    return difference
  }

  return right.id.localeCompare(left.id)
}

function App() {
  const [selectedView, setSelectedView] = useState('generate')
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [activeQuickAction, setActiveQuickAction] = useState(QUICK_ACTIONS[0].id)
  const [referenceImage, setReferenceImage] = useState(null)
  const [generationPreferences, setGenerationPreferences] = useState(
    DEFAULT_GENERATION_PREFERENCES,
  )
  const [generatedWorks, setGeneratedWorks] = useState([])
  const [hiddenWorkIds, setHiddenWorkIds] = useState([])
  const [lightboxWorkId, setLightboxWorkId] = useState(null)
  const referenceImageRef = useRef(referenceImage)

  const activeQuickActionConfig =
    QUICK_ACTIONS.find((action) => action.id === activeQuickAction) || QUICK_ACTIONS[0]
  const activeView =
    NAV_ITEMS.find((item) => item.id === selectedView) || NAV_ITEMS[1]

  useEffect(() => {
    referenceImageRef.current = referenceImage
  }, [referenceImage])

  useEffect(
    () => () => {
      if (referenceImageRef.current?.previewUrl) {
        URL.revokeObjectURL(referenceImageRef.current.previewUrl)
      }
    },
    [],
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    if (isNavDrawerOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isNavDrawerOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1181px)')
    const handleChange = (event) => {
      if (event.matches) {
        setIsNavDrawerOpen(false)
      }
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  const allWorks = useMemo(
    () =>
      generatedWorks
        .filter((work) => !hiddenWorkIds.includes(work.id))
        .sort(compareWorksByTime),
    [generatedWorks, hiddenWorkIds],
  )

  const works = useMemo(
    () =>
      allWorks.filter((work) => {
        if (work.view !== selectedView) {
          return false
        }

        if (work.status === 'generating') {
          return true
        }

        if (!matchesTimeFilter(work, timeFilter)) {
          return false
        }



        return matchesSearch(work, searchValue)
      }),
    [allWorks, searchValue, selectedView, timeFilter],
  )

  const lightboxItems = useMemo(
    () =>
      works.filter(
        (work) => work.mediaKind === 'image' && work.status !== 'generating',
      ),
    [works],
  )

  const activeLightboxIndex = lightboxItems.findIndex((work) => work.id === lightboxWorkId)

  useEffect(() => {
    if (lightboxWorkId && activeLightboxIndex === -1) {
      setLightboxWorkId(null)
    }
  }, [activeLightboxIndex, lightboxWorkId])

  const focusPromptInput = () => {
    window.requestAnimationFrame(() => {
      const promptInput = document.getElementById('jimeng-prompt-input')
      promptInput?.focus()
      promptInput?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    })
  }

  const handleGenerate = async (promptOverride) => {
    if (isGenerating) {
      return
    }

    const nextPrompt = typeof promptOverride === 'string' ? promptOverride : prompt
    const trimmedPrompt = nextPrompt.trim()

    if (!trimmedPrompt) {
      setError(createAppError('validation'))
      focusPromptInput()
      return
    }

    const quickAction = activeQuickActionConfig
    const requestOptions = {
      preferences: { ...generationPreferences },
      referenceImageName: referenceImage?.file.name || '',
    }
    const pendingWork = createGeneratingWork(trimmedPrompt, quickAction, requestOptions)

    setSelectedView('generate')
    setIsGenerating(true)
    setError(null)
    setGeneratedWorks((current) => [pendingWork, ...current])

    try {
      const formData = new FormData()
      formData.append('posterType', 'brand')
      formData.append('sizeTemplate', generationPreferences.aspectRatio)
      formData.append('title', buildTitleFromPrompt(trimmedPrompt))
      formData.append('styleDesc', buildStyleDescriptor(quickAction, generationPreferences))
      formData.append('customPrompt', trimmedPrompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)
      formData.append('logoPosition', 'auto')

      if (referenceImage?.file) {
        formData.append('referenceImage', referenceImage.file)
      }

      const response = await fetch(POSTER_API_URL, {
        method: 'POST',
        body: formData,
      })

      const rawText = await response.text()
      const payload = parseJsonSafely(rawText)

      if (!response.ok) {
        throw createResponseError({
          payload,
          rawText,
          status: response.status,
          statusText: response.statusText,
        })
      }

      const nextImage = normalizeImageSrc(
        payload?.imageUrl ||
          payload?.data?.imageUrl ||
          payload?.data?.[0]?.b64_json ||
          payload?.data?.b64_json ||
          '',
      )

      if (!nextImage) {
        throw new Error('生成完成，但未返回可预览图片。')
      }

      setTimeFilter('today')
      setGeneratedWorks((current) =>
        current.map((work) =>
          work.id === pendingWork.id ? createGeneratedWork(work, nextImage, quickAction) : work,
        ),
      )
      setPrompt('')
    } catch (requestError) {
      setGeneratedWorks((current) => current.filter((work) => work.id !== pendingWork.id))
      setError(normalizeRequestError(requestError, trimmedPrompt))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetryGenerate = () => {
    if (!error?.retryable || !error.retryPrompt) {
      return
    }

    handleGenerate(error.retryPrompt)
  }

  const handleStartCreate = () => {
    setSelectedView('generate')
    setError(null)
    focusPromptInput()
  }

  const handleSuggestionSelect = (suggestion) => {
    setSelectedView('generate')
    setPrompt(suggestion)
    setError(null)
    focusPromptInput()
  }

  const handleViewSelect = (viewId) => {
    setSelectedView(viewId)
    setIsNavDrawerOpen(false)
  }

  const handleWorkOpen = (workId) => {
    setLightboxWorkId(workId)
  }

  const handleLightboxNavigate = (nextIndex) => {
    setLightboxWorkId(lightboxItems[nextIndex]?.id || null)
  }

  const handleWorkDownload = async (work) => {
    try {
      await downloadWorkImage(work)
      setError(null)
    } catch (downloadError) {
      setError(
        createAppError('download', {
          message: normalizeMessage(downloadError?.message) || ERROR_COPY.download.message,
        }),
      )
    }
  }

  const handleWorkEdit = (work) => {
    setSelectedView('generate')
    setPrompt(work.prompt || '')
    if (work.requestOptions?.preferences) {
      setGenerationPreferences((current) => ({
        ...current,
        ...work.requestOptions.preferences,
      }))
    }
    setError(null)
    focusPromptInput()
  }

  const handleWorkRegenerate = async (work) => {
    handleWorkEdit(work)
    await handleGenerate(work.prompt)
  }

  const handleWorkDelete = (workId) => {
    if (!window.confirm('删除后将从当前时间线隐藏这张作品，确认继续吗？')) {
      return
    }

    setHiddenWorkIds((current) =>
      current.includes(workId) ? current : [...current, workId],
    )

    if (lightboxWorkId === workId) {
      setLightboxWorkId(null)
    }
  }

  const handleReferenceImageChange = (file) => {
    if (!file) {
      return
    }

    if (!String(file.type || '').startsWith('image/')) {
      setError(
        createAppError('other', {
          title: '参考图格式不支持',
          message: '请上传 PNG 或 JPG 图片作为参考图。',
        }),
      )
      return
    }

    if (Number(file.size || 0) > MAX_REFERENCE_IMAGE_SIZE) {
      setError(
        createAppError('other', {
          title: '参考图过大',
          message: '参考图大小不能超过 10MB。',
        }),
      )
      return
    }

    if (referenceImage?.previewUrl) {
      URL.revokeObjectURL(referenceImage.previewUrl)
    }

    setReferenceImage({
      id: `reference-${Date.now()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    })
    setError(null)
  }

  const handleReferenceImageRemove = () => {
    if (referenceImage?.previewUrl) {
      URL.revokeObjectURL(referenceImage.previewUrl)
    }

    setReferenceImage(null)
  }

  const handlePreferenceChange = (field, nextValue) => {
    setGenerationPreferences((current) => {
      if (!(field in current)) {
        return current
      }

      return {
        ...current,
        [field]: nextValue,
      }
    })
  }

  return (
    <div className="jimeng-layout">
      <Sidebar
        items={NAV_ITEMS}
        selectedItem={selectedView}
        onSelect={handleViewSelect}
      />

      <div className="main-shell">
        <TopBar
          viewLabel={activeView.label}
          viewDescription={activeView.description}
          isNavDrawerOpen={isNavDrawerOpen}
          onMenuToggle={() => setIsNavDrawerOpen((current) => !current)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          timeOptions={TIME_FILTER_OPTIONS}
        />

        <div className="workspace-scroll">
          <div className="workspace-inner">
            <TimelineFeed
              works={works}
              hasAnyWorks={allWorks.length > 0}
              activeViewLabel={activeView.label}
              searchValue={searchValue}
              onWorkOpen={handleWorkOpen}
              onWorkDownload={handleWorkDownload}
              onWorkRegenerate={handleWorkRegenerate}
              onWorkEdit={handleWorkEdit}
              onWorkDelete={handleWorkDelete}
              onStartCreate={handleStartCreate}
              onSuggestionSelect={handleSuggestionSelect}
              suggestions={EMPTY_STATE_SUGGESTIONS}
              resetKey={[
                selectedView,
                searchValue.trim().toLowerCase(),
                timeFilter,
                generatedWorks.map((work) => `${work.id}:${work.status}`).join(','),
                hiddenWorkIds.length,
              ].join('|')}
            />
          </div>
        </div>
      </div>

      {/* 输入框移到最外层，确保 fixed 定位相对于视口 */}
      <div className="prompt-input-viewport">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleGenerate}
          onRetry={handleRetryGenerate}
          isGenerating={isGenerating}
          error={error}
          quickActions={QUICK_ACTIONS}
          activeQuickAction={activeQuickAction}
          onQuickActionChange={setActiveQuickAction}
          referenceImage={referenceImage}
          onReferenceImageChange={handleReferenceImageChange}
          onReferenceImageRemove={handleReferenceImageRemove}
          preferences={generationPreferences}
          onPreferenceChange={handlePreferenceChange}
        />
      </div>

      <MobileNav
        items={MOBILE_NAV_ITEMS}
        selectedItem={selectedView}
        onSelect={handleViewSelect}
      />

      <div className={`app-drawer-layer${isNavDrawerOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="app-drawer-backdrop"
          onClick={() => setIsNavDrawerOpen(false)}
          aria-label="关闭导航遮罩"
        />
        <Sidebar
          items={NAV_ITEMS}
          selectedItem={selectedView}
          onSelect={handleViewSelect}
          variant="drawer"
          isOpen={isNavDrawerOpen}
          onClose={() => setIsNavDrawerOpen(false)}
          id="mobile-sidebar-drawer"
        />
      </div>

      <Lightbox
        items={lightboxItems}
        activeIndex={activeLightboxIndex}
        isOpen={activeLightboxIndex >= 0}
        onClose={() => setLightboxWorkId(null)}
        onNavigate={handleLightboxNavigate}
        onDownload={handleWorkDownload}
      />
    </div>
  )
}

export default App
