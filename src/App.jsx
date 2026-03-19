import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Lightbox from './components/Lightbox'
import MobileNav from './components/MobileNav'
import Sidebar from './components/Sidebar'
import TimelineFeed from './components/TimelineFeed'
import TopBar from './components/TopBar'
import PromptInput from './components/PromptInput'
import { POSTER_API_URL } from './config'
import { downloadWorkImage, shareWork } from './utils/download'

const DEFAULT_NEGATIVE_PROMPT =
  '文字、数字、水印、签名、尺寸标注、模糊、低清晰度、杂乱、过曝、欠曝、噪点、重复元素、压缩痕迹、锯齿边缘'
const MIN_BASE64_IMAGE_LENGTH = 64
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/

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

const MOBILE_NAV_ITEMS = NAV_ITEMS

const TIME_FILTER_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '近 7 天' },
  { value: 'month', label: '近 30 天' },
]

const MEDIA_FILTER_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: '图像', label: '图像' },
  { value: '视频', label: '视频' },
]

const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: '全部操作' },
  { value: '生成', label: '生成' },
  { value: '编辑', label: '编辑' },
  { value: '延展', label: '延展' },
]

const TIME_BUCKET_DAY_OFFSETS = {
  today: 0,
  yesterday: -1,
  week: -7,
  month: -30,
}

const SEED_WORKS = [
  {
    id: 'seed-01',
    view: 'generate',
    dateLabel: '今天',
    timeBucket: 'today',
    createdAt: '09:18',
    author: 'Luna',
    avatar: 'LU',
    prompt: '高端护肤品牌 KV，玻璃器皿与白色花瓣悬浮，晨光透入，极简留白。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '生成',
    headline: '晨雾护肤',
    tone: '冷白高光与产品聚焦',
    surface:
      'linear-gradient(160deg, #f8fbff 0%, #e0efff 48%, #bfd7ff 100%)',
    aspectRatio: '4 / 5',
  },
  {
    id: 'seed-02',
    view: 'inspiration',
    dateLabel: '今天',
    timeBucket: 'today',
    createdAt: '08:44',
    author: 'Ming',
    avatar: 'MI',
    prompt: '城市轻户外运动大片，晨跑女性穿过玻璃长廊，蓝白色块，海报感排版。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '编辑',
    headline: '轻户外构图',
    tone: '通透感与动态留白',
    surface:
      'linear-gradient(180deg, #eff8ff 0%, #d5ecff 58%, #a8d4ff 100%)',
    aspectRatio: '4 / 6',
  },
  {
    id: 'seed-03',
    view: 'canvas',
    dateLabel: '今天',
    timeBucket: 'today',
    createdAt: '08:12',
    author: 'Nora',
    avatar: 'NO',
    prompt: '科技峰会主视觉延展，纵向主海报到横版社媒封面统一语言，白银灰色系。',
    mediaType: '视频',
    mediaKind: 'video',
    actionType: '延展',
    headline: '峰会延展',
    tone: '版式切换与节奏预演',
    surface:
      'linear-gradient(160deg, #f5f7fb 0%, #dfe8f4 42%, #c4d2e5 100%)',
    aspectRatio: '16 / 9',
  },
  {
    id: 'seed-04',
    view: 'assets',
    dateLabel: '今天',
    timeBucket: 'today',
    createdAt: '07:30',
    author: 'Ava',
    avatar: 'AV',
    prompt: '电商品牌春季素材包，模特半身、彩妆瓶身、花瓣纹理和贴纸元素分层整理。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '编辑',
    headline: '春季素材包',
    tone: '便于二次排版的资产整理',
    surface:
      'linear-gradient(160deg, #fff9f5 0%, #ffe9df 48%, #ffd2bf 100%)',
    aspectRatio: '1 / 1',
  },
  {
    id: 'seed-05',
    view: 'generate',
    dateLabel: '昨天',
    timeBucket: 'yesterday',
    createdAt: '21:16',
    author: 'Suki',
    avatar: 'SU',
    prompt: '精品咖啡新品海报，桌面微距，奶泡与银色勺子形成 S 曲线，杂志封面视角。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '生成',
    headline: '咖啡新品',
    tone: '质感器物与轻商业调性',
    surface:
      'linear-gradient(165deg, #fff8f2 0%, #f7dccb 52%, #d1b39f 100%)',
    aspectRatio: '4 / 5',
  },
  {
    id: 'seed-06',
    view: 'inspiration',
    dateLabel: '昨天',
    timeBucket: 'yesterday',
    createdAt: '20:42',
    author: 'Kai',
    avatar: 'KA',
    prompt: '青年耳机品牌视觉参考，透明亚克力道具，冷色氛围，科技电商拍法。',
    mediaType: '视频',
    mediaKind: 'video',
    actionType: '延展',
    headline: '耳机动态板',
    tone: '产品运动轨迹和镜头提案',
    surface:
      'linear-gradient(160deg, #f6fbff 0%, #d7ebff 50%, #8fc7ff 100%)',
    aspectRatio: '3 / 4',
  },
  {
    id: 'seed-07',
    view: 'canvas',
    dateLabel: '昨天',
    timeBucket: 'yesterday',
    createdAt: '18:35',
    author: 'Ivy',
    avatar: 'IV',
    prompt: '公益展览导视系统画布，网格排版，轻蓝线框与大标题对齐方案。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '编辑',
    headline: '导视画布',
    tone: '栅格系统与留白控制',
    surface:
      'linear-gradient(180deg, #fafcff 0%, #e7f0fb 54%, #d6e3f4 100%)',
    aspectRatio: '4 / 5',
  },
  {
    id: 'seed-08',
    view: 'assets',
    dateLabel: '昨天',
    timeBucket: 'yesterday',
    createdAt: '17:08',
    author: 'Rae',
    avatar: 'RA',
    prompt: '茶饮品牌包装资产，标签刀版、LOGO 组合与插画纹样的统一输出。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '编辑',
    headline: '包装资产',
    tone: '品牌组件归档',
    surface:
      'linear-gradient(160deg, #f8fff6 0%, #ddf7d8 48%, #b9e9b7 100%)',
    aspectRatio: '4 / 4.8',
  },
  {
    id: 'seed-09',
    view: 'generate',
    dateLabel: '2025年2月14日',
    timeBucket: 'week',
    createdAt: '15:24',
    author: 'Yao',
    avatar: 'YA',
    prompt: '婚礼酒店主视觉，水晶灯与丝绸桌布，白金色奢雅但不过度繁复。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '生成',
    headline: '婚礼主视觉',
    tone: '白金层次与柔雾空间',
    surface:
      'linear-gradient(160deg, #fffefd 0%, #f6eee1 50%, #e5d5bf 100%)',
    aspectRatio: '4 / 6',
  },
  {
    id: 'seed-10',
    view: 'inspiration',
    dateLabel: '2025年2月14日',
    timeBucket: 'week',
    createdAt: '14:06',
    author: 'Tina',
    avatar: 'TI',
    prompt: '轻奢珠宝大片参考，弧形镜面、半透明亚克力台座，偏 editorial 审美。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '编辑',
    headline: '珠宝灵感',
    tone: '镜面反射与极细字体',
    surface:
      'linear-gradient(170deg, #fdfcff 0%, #ece7fb 52%, #d0c5f4 100%)',
    aspectRatio: '4 / 5.4',
  },
  {
    id: 'seed-11',
    view: 'canvas',
    dateLabel: '2025年2月08日',
    timeBucket: 'month',
    createdAt: '11:20',
    author: 'Echo',
    avatar: 'EC',
    prompt: '新品发布会大屏与邀请函同源画布，横竖版切换验证，保留白色主基底。',
    mediaType: '视频',
    mediaKind: 'video',
    actionType: '延展',
    headline: '发布会画布',
    tone: '主视觉系统化预演',
    surface:
      'linear-gradient(165deg, #f8fafc 0%, #e7edf5 48%, #d8dfeb 100%)',
    aspectRatio: '16 / 10',
  },
  {
    id: 'seed-12',
    view: 'assets',
    dateLabel: '2025年2月08日',
    timeBucket: 'month',
    createdAt: '10:18',
    author: 'Demi',
    avatar: 'DE',
    prompt: '宠物品牌社媒模板资产，白底卡片组件、圆角角标和柔和插画边框整理。',
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '编辑',
    headline: '社媒模板库',
    tone: '适合批量替换内容的基础模板',
    surface:
      'linear-gradient(160deg, #fffef8 0%, #fff1d8 52%, #f8d597 100%)',
    aspectRatio: '1 / 1',
  },
]

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

  if (status >= 500) {
    return `生成服务暂时不可用（${status} ${normalizeMessage(statusText)}）。`
  }

  return `生成失败（${status} ${normalizeMessage(statusText)}）。`
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

const createGeneratedWork = (prompt, imageSrc, quickAction) => {
  const now = new Date()
  const createdAt = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return {
    id: `generated-${now.getTime()}`,
    view: 'generate',
    dateLabel: '今天',
    timeBucket: 'today',
    createdAt,
    author: '你',
    avatar: 'ME',
    prompt,
    mediaType: '图像',
    mediaKind: 'image',
    actionType: '生成',
    headline: buildTitleFromPrompt(prompt) || '即时创作',
    tone: `${quickAction.label} · 最新生成`,
    imageSrc,
    sortTimestamp: now.getTime(),
    surface:
      'linear-gradient(160deg, #f8fbff 0%, #ebf2ff 48%, #d9e7ff 100%)',
    aspectRatio: '4 / 5',
  }
}

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
  const difference = resolveWorkTimestamp(left) - resolveWorkTimestamp(right)

  if (difference !== 0) {
    return difference
  }

  return left.id.localeCompare(right.id)
}

function App() {
  const [selectedView, setSelectedView] = useState('generate')
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [mediaFilter, setMediaFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [activeQuickAction, setActiveQuickAction] = useState(QUICK_ACTIONS[0].id)
  const [generatedWorks, setGeneratedWorks] = useState([])
  const [hiddenWorkIds, setHiddenWorkIds] = useState([])
  const [lightboxWorkId, setLightboxWorkId] = useState(null)

  const activeQuickActionConfig =
    QUICK_ACTIONS.find((action) => action.id === activeQuickAction) || QUICK_ACTIONS[0]
  const activeView =
    NAV_ITEMS.find((item) => item.id === selectedView) || NAV_ITEMS[1]

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
      [...SEED_WORKS, ...generatedWorks]
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

        if (!matchesTimeFilter(work, timeFilter)) {
          return false
        }

        if (mediaFilter !== 'all' && work.mediaType !== mediaFilter) {
          return false
        }

        if (actionFilter !== 'all' && work.actionType !== actionFilter) {
          return false
        }

        return matchesSearch(work, searchValue)
      }),
    [actionFilter, allWorks, mediaFilter, searchValue, selectedView, timeFilter],
  )

  const lightboxItems = useMemo(
    () => works.filter((work) => work.mediaKind === 'image'),
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
    const trimmedPrompt = String(promptOverride ?? prompt).trim()

    if (!trimmedPrompt) {
      setError('请输入创作描述。')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('posterType', 'brand')
      formData.append('sizeTemplate', 'mobile')
      formData.append('title', buildTitleFromPrompt(trimmedPrompt))
      formData.append('styleDesc', `极简白色卡片式海报，${activeQuickActionConfig.label}`)
      formData.append('customPrompt', trimmedPrompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)
      formData.append('logoPosition', 'auto')

      const response = await fetch(POSTER_API_URL, {
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
        payload?.imageUrl ||
          payload?.data?.imageUrl ||
          payload?.data?.[0]?.b64_json ||
          payload?.data?.b64_json ||
          '',
      )

      if (!nextImage) {
        throw new Error('生成完成，但未返回可预览图片。')
      }

      setSelectedView('generate')
      setTimeFilter('today')
      setGeneratedWorks((current) => [
        ...current,
        createGeneratedWork(trimmedPrompt, nextImage, activeQuickActionConfig),
      ])
      setPrompt('')
    } catch (requestError) {
      setError(normalizeMessage(requestError?.message) || '生成失败，请稍后重试。')
    } finally {
      setIsGenerating(false)
    }
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
    } catch (downloadError) {
      setError(normalizeMessage(downloadError?.message) || '下载失败，请稍后重试。')
    }
  }

  const handleWorkEdit = (work) => {
    setSelectedView('generate')
    setPrompt(work.prompt || '')
    setError('')
    focusPromptInput()
  }

  const handleWorkRegenerate = async (work) => {
    handleWorkEdit(work)
    await handleGenerate(work.prompt)
  }

  const handleWorkShare = async (work) => {
    try {
      await shareWork(work)
    } catch (shareError) {
      setError(normalizeMessage(shareError?.message) || '分享失败，请稍后重试。')
    }
  }

  const handleWorkDelete = (workId) => {
    setHiddenWorkIds((current) =>
      current.includes(workId) ? current : [...current, workId],
    )

    if (lightboxWorkId === workId) {
      setLightboxWorkId(null)
    }
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
          mediaFilter={mediaFilter}
          onMediaFilterChange={setMediaFilter}
          mediaOptions={MEDIA_FILTER_OPTIONS}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          actionOptions={ACTION_FILTER_OPTIONS}
          resultCount={works.length}
        />

        <div className="workspace-scroll">
          <div className="workspace-inner">
            <TimelineFeed
              works={works}
              activeViewLabel={activeView.label}
              searchValue={searchValue}
              onWorkOpen={handleWorkOpen}
              onWorkDownload={handleWorkDownload}
              onWorkRegenerate={handleWorkRegenerate}
              onWorkEdit={handleWorkEdit}
              onWorkShare={handleWorkShare}
              onWorkDelete={handleWorkDelete}
              resetKey={[
                selectedView,
                searchValue.trim().toLowerCase(),
                timeFilter,
                mediaFilter,
                actionFilter,
                generatedWorks.length,
              ].join('|')}
            />

            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              error={error}
              quickActions={QUICK_ACTIONS}
              activeQuickAction={activeQuickAction}
              onQuickActionChange={setActiveQuickAction}
            />
          </div>
        </div>
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
