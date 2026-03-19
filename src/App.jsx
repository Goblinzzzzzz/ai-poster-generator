import { useState } from 'react'
import { POSTER_API_URL } from './config'

const DEFAULT_NEGATIVE_PROMPT =
  '文字、数字、水印、签名、尺寸标注、日期、时间、版本号、模糊、低质量、变形、杂乱、过曝、欠曝、噪点、畸形、多余手指、错误解剖、重复元素、低分辨率、压缩痕迹、色带、锯齿边缘'
const MIN_BASE64_IMAGE_LENGTH = 64
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/

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

function App() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedImage, setGeneratedImage] = useState('')

  const promptLength = prompt.trim().length

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()

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
      formData.append('styleDesc', '极简紫色沉浸海报')
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

      setGeneratedImage(nextImage)
    } catch (requestError) {
      setError(normalizeMessage(requestError?.message) || '生成失败，请稍后重试。')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTextareaKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      if (!isGenerating) {
        handleGenerate()
      }
    }
  }

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" aria-hidden="true" />
      <div className="background-glow background-glow-right" aria-hidden="true" />

      <main className="immersive-layout">
        <section className="creation-container">
          <div className="hero-copy">
            <span className="hero-badge">P0-001 Minimal Create Mode</span>
            <h1 className="hero-title">把想法写下来，直接生成海报。</h1>
            <p className="hero-subtitle">
              去掉左右分栏，只保留核心创作输入。用一句描述启动生成，让注意力回到画面本身。
            </p>
          </div>

          <section className="prompt-panel">
            <div className="prompt-header">
              <div>
                <span className="panel-kicker">Prompt</span>
                <h2 className="panel-title">创作描述</h2>
              </div>
              <span className="panel-note">仅保留核心输入</span>
            </div>

            <label className="sr-only" htmlFor="prompt-input">
              创作描述
            </label>
            <textarea
              id="prompt-input"
              className="prompt-textarea"
              placeholder="描述你想生成的画面..."
              value={prompt}
              autoFocus
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
            />

            <div className="prompt-meta">
              <span>{promptLength} 字</span>
              <span>按 Ctrl/Command + Enter 快速生成</span>
            </div>

            <button
              type="button"
              className="generate-button"
              onClick={handleGenerate}
              disabled={isGenerating}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="button-spinner" aria-hidden="true" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span className="button-icon" aria-hidden="true">
                    ✨
                  </span>
                  <span>立即生成</span>
                </>
              )}
            </button>

            {error ? (
              <div className="feedback-card feedback-card-error" role="alert">
                {error}
              </div>
            ) : null}
          </section>

          {generatedImage ? (
            <section className="preview-panel" aria-live="polite">
              <div className="preview-header">
                <div>
                  <span className="panel-kicker">Preview</span>
                  <h2 className="panel-title">生成结果</h2>
                </div>
                <span className="panel-note">再次生成会刷新当前预览</span>
              </div>

              <div className="preview-frame">
                <img className="preview-image" src={generatedImage} alt="最新生成海报" />
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default App
