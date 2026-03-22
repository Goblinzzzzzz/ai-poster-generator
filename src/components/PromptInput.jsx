import { useEffect, useRef, useState } from 'react'
import ErrorAlert from './ErrorAlert'
import './PromptInput.css'

const MODE_OPTIONS = [
  {
    id: 'image',
    label: '图片生成',
    helper: '海报、插画、摄影感画面',
  },
  {
    id: 'video',
    label: '视频生成',
    helper: '镜头运动、节奏、转场描述',
  },
  {
    id: 'agent',
    label: 'Agent 模式',
    helper: '拆解复杂任务，组织创作步骤',
  },
]

const ASSIST_ACTIONS = [
  {
    id: 'scene',
    label: '场景强化',
    helper: '补齐场景、光线、构图、材质、色彩',
  },
  {
    id: 'reference',
    label: '参考图思路',
    helperWithImage: '提炼构图、关系、色调和参考方向',
    helperWithoutImage: '没上传图也会生成明确参考方向',
  },
  {
    id: 'copy',
    label: '文案优化',
    helper: '整理卖点、语气和风格统一',
  },
]

const ASPECT_RATIO_OPTIONS = [
  { value: 'mobile', label: '9:16' },
  { value: 'weibo', label: '1:1' },
  { value: 'a4', label: '3:4' },
  { value: 'wechat_cover', label: '16:9' },
]

const CLARITY_OPTIONS = [
  { value: 'auto', label: '自动' },
  { value: 'standard', label: '标准' },
  { value: 'high', label: '高清' },
]

const PROMPT_PLACEHOLDER =
  'Seedance 2.0 全能参考，上传参考、输入文字，创意无限可能'

function PlusIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 4.167v11.666M4.167 10h11.666"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronDownIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5.833 7.917 4.167 4.166 4.167-4.166"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowUpIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 15V5m0 0L6.25 8.75M10 5l3.75 3.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SparkIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m10 3.75 1.527 3.196 3.306.48-2.417 2.355.57 3.325L10 11.5l-2.986 1.606.57-3.325-2.417-2.355 3.306-.48L10 3.75Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m6 6 8 8m0-8-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function PromptInput({
  value,
  onChange,
  onSubmit,
  onRetry,
  isGenerating,
  error,
  referenceImages = [],
  onReferenceImageAdd,
  onReferenceImageRemove,
  preferences,
  onPreferenceChange,
  activeAssistActionId,
  assistResult,
  onAssistAction,
  onAssistUndo,
  onAssistDismiss,
  selectedModeId,
  onModeChange,
}) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const [localModeId, setLocalModeId] = useState(selectedModeId || 'agent')
  const [isImagesExpanded, setIsImagesExpanded] = useState(false)
  const modeMenuRef = useRef(null)
  const preferenceMenuRef = useRef(null)
  const inspirationMenuRef = useRef(null)
  const uploadInputRef = useRef(null)
  const textareaRef = useRef(null)

  const activeModeId = selectedModeId ?? localModeId
  const selectedMode =
    MODE_OPTIONS.find((mode) => mode.id === activeModeId) ?? MODE_OPTIONS[2]
  const hasReferenceImages = referenceImages.length > 0

  useEffect(() => {
    if (selectedModeId) {
      setLocalModeId(selectedModeId)
    }
  }, [selectedModeId])

  useEffect(() => {
    if (!openMenuId) {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target

      if (
        openMenuId === 'mode' &&
        modeMenuRef.current &&
        !modeMenuRef.current.contains(target)
      ) {
        setOpenMenuId(null)
      }

      if (
        openMenuId === 'preferences' &&
        preferenceMenuRef.current &&
        !preferenceMenuRef.current.contains(target)
      ) {
        setOpenMenuId(null)
      }

      if (
        openMenuId === 'assist' &&
        inspirationMenuRef.current &&
        !inspirationMenuRef.current.contains(target)
      ) {
        setOpenMenuId(null)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openMenuId])

  const resizeTextarea = () => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'

    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 24
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 3
    const targetHeight = Math.min(maxHeight, Math.max(minHeight, textarea.scrollHeight))

    textarea.style.height = `${targetHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    resizeTextarea()
  }, [value])

  useEffect(() => {
    if (!hasReferenceImages) {
      setIsImagesExpanded(false)
    }
  }, [hasReferenceImages])

  const handlePromptChange = (event) => {
    onChange(event.target.value)
    requestAnimationFrame(resizeTextarea)
  }

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()

      if (!isGenerating) {
        onSubmit()
      }
    }

    if (event.key === 'Escape') {
      setOpenMenuId(null)
    }
  }

  const handleModeSelect = (modeId) => {
    if (!selectedModeId) {
      setLocalModeId(modeId)
    }

    onModeChange?.(modeId)
    setOpenMenuId(null)
  }

  const handleReferenceUpload = (event) => {
    const [nextFile] = Array.from(event.target.files || [])

    if (nextFile) {
      onReferenceImageAdd(nextFile)
    }

    event.target.value = ''
  }

  const handleAssistSelect = (actionId) => {
    if (Boolean(activeAssistActionId) || isGenerating) {
      return
    }

    onAssistDismiss?.()
    onAssistAction?.(actionId)
    setOpenMenuId(null)
  }

  return (
    <div className="prompt-dock">
      <section className="prompt-panel" aria-label="创作输入框">
        <div className="prompt-input-shell">
          <div className="prompt-main-row">
            <div className="prompt-reference-wrap">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="prompt-reference-input"
                onChange={handleReferenceUpload}
              />

              <button
                type="button"
                className={`prompt-reference-card${hasReferenceImages ? ' is-active' : ''}${
                  isImagesExpanded ? ' is-expanded' : ''
                }`}
                onClick={() => {
                  if (!hasReferenceImages) {
                    uploadInputRef.current?.click()
                    return
                  }

                  setIsImagesExpanded((current) => !current)
                }}
                aria-label={hasReferenceImages ? '查看或管理参考图' : '上传参考图'}
              >
                {!hasReferenceImages ? (
                  <>
                    <span className="prompt-reference-media" aria-hidden="true">
                      <PlusIcon className="prompt-reference-plus" />
                    </span>
                    <span className="prompt-reference-copy">上传参考</span>
                  </>
                ) : isImagesExpanded ? (
                  <div className="prompt-image-grid" onClick={(event) => event.stopPropagation()}>
                    {referenceImages.map((image) => (
                      <div key={image.id} className="prompt-image-item">
                        <img src={image.previewUrl} alt="参考图" />
                        <button
                          type="button"
                          className="prompt-image-remove"
                          onClick={(event) => {
                            event.stopPropagation()
                            onReferenceImageRemove(image.id)
                          }}
                          aria-label="删除参考图"
                        >
                          <CloseIcon className="prompt-image-remove-icon" />
                        </button>
                      </div>
                    ))}

                    {referenceImages.length < 4 ? (
                      <button
                        type="button"
                        className="prompt-image-add"
                        onClick={(event) => {
                          event.stopPropagation()
                          uploadInputRef.current?.click()
                        }}
                        aria-label="添加更多参考图"
                      >
                        <PlusIcon className="prompt-image-add-icon" />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <span className="prompt-reference-media" aria-hidden="true">
                      <img
                        src={referenceImages[0]?.previewUrl}
                        alt="参考图"
                        className="preview-img"
                      />
                    </span>
                    <span className="prompt-reference-copy">已上传 {referenceImages.length}/4</span>
                    <div className="prompt-image-dots" aria-hidden="true">
                      {referenceImages.map((image) => (
                        <span key={image.id} className="dot" />
                      ))}
                    </div>
                  </>
                )}
              </button>

              {referenceImages.length === 1 ? (
                <button
                  type="button"
                  className="prompt-reference-remove"
                  onClick={() => onReferenceImageRemove(referenceImages[0].id)}
                  aria-label="删除参考图"
                >
                  <CloseIcon className="prompt-reference-remove-icon" />
                </button>
              ) : null}
            </div>

            <div className="prompt-input-wrap">
              <label className="sr-only" htmlFor="jimeng-prompt-input">
                创作提示词
              </label>
              <textarea
                ref={textareaRef}
                id="jimeng-prompt-input"
                className="prompt-textarea"
                placeholder={PROMPT_PLACEHOLDER}
                value={value}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                rows={2}
              />
            </div>
          </div>

          <div className="prompt-toolbar-row">
            <div className="prompt-toolbar-left">
              <div className="prompt-dropdown-wrap" ref={modeMenuRef}>
                <button
                  type="button"
                  className={`prompt-action-btn prompt-action-btn--dropdown${
                    openMenuId === 'mode' ? ' is-active' : ''
                  }`}
                  aria-expanded={openMenuId === 'mode'}
                  aria-controls="prompt-mode-menu"
                  onClick={() =>
                    setOpenMenuId((current) => (current === 'mode' ? null : 'mode'))
                  }
                >
                  <span>{selectedMode.label}</span>
                  <ChevronDownIcon className="prompt-action-icon" />
                </button>

                {openMenuId === 'mode' ? (
                  <div
                    id="prompt-mode-menu"
                    className="prompt-floating-panel prompt-mode-menu"
                    role="listbox"
                    aria-label="主模式"
                  >
                    {MODE_OPTIONS.map((mode) => {
                      const isSelected = mode.id === selectedMode.id

                      return (
                        <button
                          key={mode.id}
                          type="button"
                          className={`prompt-menu-option${isSelected ? ' is-selected' : ''}`}
                          onClick={() => handleModeSelect(mode.id)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>{mode.label}</span>
                          <small>{mode.helper}</small>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              <div className="prompt-dropdown-wrap" ref={preferenceMenuRef}>
                <button
                  type="button"
                  className={`prompt-action-btn prompt-action-btn--dropdown${
                    openMenuId === 'preferences' ? ' is-active' : ''
                  }`}
                  aria-expanded={openMenuId === 'preferences'}
                  aria-controls="prompt-preference-menu"
                  onClick={() =>
                    setOpenMenuId((current) =>
                      current === 'preferences' ? null : 'preferences',
                    )
                  }
                >
                  <span>自动</span>
                  <ChevronDownIcon className="prompt-action-icon" />
                </button>

                {openMenuId === 'preferences' ? (
                  <div
                    id="prompt-preference-menu"
                    className="prompt-floating-panel prompt-preference-menu"
                  >
                    <div className="prompt-menu-group">
                      <p className="prompt-menu-label">比例</p>
                      <div className="prompt-chip-grid">
                        {ASPECT_RATIO_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`prompt-chip${
                              preferences.aspectRatio === option.value ? ' is-selected' : ''
                            }`}
                            onClick={() => onPreferenceChange('aspectRatio', option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="prompt-menu-group">
                      <p className="prompt-menu-label">清晰度</p>
                      <div className="prompt-inline-options">
                        {CLARITY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`prompt-chip${
                              preferences.clarity === option.value ? ' is-selected' : ''
                            }`}
                            onClick={() => onPreferenceChange('clarity', option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`prompt-toggle-btn${
                        preferences.autoEnhance ? ' is-selected' : ''
                      }`}
                      aria-pressed={preferences.autoEnhance}
                      onClick={() =>
                        onPreferenceChange('autoEnhance', !preferences.autoEnhance)
                      }
                    >
                      自动增强 {preferences.autoEnhance ? '已开启' : '已关闭'}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="prompt-dropdown-wrap" ref={inspirationMenuRef}>
                <button
                  type="button"
                  className={`prompt-action-btn prompt-action-btn--dropdown${
                    openMenuId === 'assist' ? ' is-active' : ''
                  }`}
                  aria-expanded={openMenuId === 'assist'}
                  aria-controls="prompt-assist-menu"
                  onClick={() =>
                    setOpenMenuId((current) => (current === 'assist' ? null : 'assist'))
                  }
                  disabled={Boolean(activeAssistActionId) || isGenerating}
                >
                  <span>灵感</span>
                  <ChevronDownIcon className="prompt-action-icon" />
                </button>

                {openMenuId === 'assist' ? (
                  <div
                    id="prompt-assist-menu"
                    className="prompt-floating-panel prompt-assist-menu"
                    role="listbox"
                    aria-label="灵感策略"
                  >
                    {ASSIST_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className="prompt-menu-option"
                        onClick={() => handleAssistSelect(action.id)}
                        disabled={Boolean(activeAssistActionId) || isGenerating}
                      >
                        <span className="prompt-menu-option-title">
                          <SparkIcon className="prompt-menu-option-icon" />
                          {action.label}
                        </span>
                        <small>
                          {hasReferenceImages
                            ? action.helper || action.helperWithImage
                            : action.helperWithoutImage || action.helper}
                        </small>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button type="button" className="prompt-action-btn">
                创意设计
              </button>
            </div>

            <button
              type="button"
              className="prompt-submit"
              onClick={onSubmit}
              disabled={isGenerating}
              aria-busy={isGenerating}
              aria-label={isGenerating ? '提交中' : '提交'}
              title={isGenerating ? '提交中' : '提交'}
            >
              <ArrowUpIcon className={`prompt-submit-icon${isGenerating ? ' is-busy' : ''}`} />
            </button>
          </div>
        </div>

        {assistResult?.canUndo ? (
          <div className="prompt-undo-bar">
            <button
              type="button"
              className="prompt-undo-btn"
              onClick={onAssistUndo}
            >
              <svg viewBox="0 0 20 20" fill="none" className="prompt-undo-icon">
                <path
                  d="M4 10h12m0 0l-4-4m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>撤回</span>
            </button>
          </div>
        ) : null}

        <ErrorAlert error={error} onRetry={onRetry} />
      </section>
    </div>
  )
}
