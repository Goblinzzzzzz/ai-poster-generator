import { useEffect, useRef, useState } from 'react'
import ErrorAlert from './ErrorAlert'
import './PromptInput.css'

const MODE_OPTIONS = [
  {
    id: 'image',
    label: '图片生成',
    shortLabel: '图片',
    helper: '海报、插画、摄影感画面',
    placeholder:
      '描述主体、场景、构图与风格，例如：一只猫咪在窗台上晒太阳，电影感逆光，治愈系胶片色彩',
    submitLabel: '生成图片',
    generatingLabel: '生成图片中...',
  },
  {
    id: 'video',
    label: '视频生成',
    shortLabel: '视频',
    helper: '镜头运动、节奏、转场描述',
    placeholder:
      '描述画面变化、镜头语言与节奏，例如：清晨城市街道从远景推进到咖啡店橱窗，轻微手持感，慢节奏转场',
    submitLabel: '生成视频',
    generatingLabel: '生成视频中...',
  },
  {
    id: 'agent',
    label: 'Agent 模式',
    shortLabel: 'Agent',
    helper: '拆解复杂任务，组织创作步骤',
    placeholder:
      '描述目标、约束与希望 Agent 协助的任务，例如：为夏日饮品海报整理三套创意方向，并补充风格关键词与镜头建议',
    submitLabel: '生成方案',
    generatingLabel: '生成方案中...',
  },
]

const ASSIST_ACTIONS = [
  {
    id: 'scene',
    label: '场景强化',
    helper: '补齐场景、光线、构图、材质、色彩',
    modeLabel: '回填 Prompt',
  },
  {
    id: 'reference',
    label: '参考图思路',
    helperWithImage: '提炼构图、关系、色调和参考方向',
    helperWithoutImage: '没上传图也会生成明确参考方向',
    modeLabel: '追加方向',
  },
  {
    id: 'copy',
    label: '文案优化',
    helper: '整理卖点、语气和风格统一',
    modeLabel: '回填文案',
  },
]

const ASPECT_RATIO_OPTIONS = [
  { value: 'mobile', label: '9:16', hint: '手机海报' },
  { value: 'weibo', label: '1:1', hint: '正方构图' },
  { value: 'a4', label: '3:4', hint: '竖版海报' },
  { value: 'wechat_cover', label: '16:9', hint: '横版封面' },
]

const CLARITY_OPTIONS = [
  { value: 'auto', label: '自动' },
  { value: 'standard', label: '标准' },
  { value: 'high', label: '高清' },
]

const getAspectRatioLabel = (value) =>
  ASPECT_RATIO_OPTIONS.find((option) => option.value === value)?.label || '9:16'

const getClarityLabel = (value) =>
  CLARITY_OPTIONS.find((option) => option.value === value)?.label || '自动'

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

export default function PromptInput({
  value,
  onChange,
  onSubmit,
  onRetry,
  isGenerating,
  error,
  referenceImage,
  onReferenceImageChange,
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
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false)
  const [isPreferencePanelOpen, setIsPreferencePanelOpen] = useState(false)
  const modeMenuRef = useRef(null)
  const preferencePanelRef = useRef(null)
  const uploadInputRef = useRef(null)
  const selectedMode =
    MODE_OPTIONS.find((mode) => mode.id === selectedModeId) ?? MODE_OPTIONS[0]

  useEffect(() => {
    if (!isModeMenuOpen && !isPreferencePanelOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (
        isModeMenuOpen &&
        modeMenuRef.current &&
        !modeMenuRef.current.contains(event.target)
      ) {
        setIsModeMenuOpen(false)
      }

      if (
        isPreferencePanelOpen &&
        preferencePanelRef.current &&
        !preferencePanelRef.current.contains(event.target)
      ) {
        setIsPreferencePanelOpen(false)
      }

    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsModeMenuOpen(false)
        setIsPreferencePanelOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isModeMenuOpen, isPreferencePanelOpen])

  const closeFloatingPanels = () => {
    setIsModeMenuOpen(false)
    setIsPreferencePanelOpen(false)
  }

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()

      if (!isGenerating) {
        onSubmit()
      }
    }

    if (event.key === 'Escape') {
      closeFloatingPanels()
    }
  }

  const handleSubmit = () => {
    if (!isGenerating) {
      onSubmit()
    }
  }

  const handleModeSelect = (modeId) => {
    onModeChange?.(modeId)
    setIsModeMenuOpen(false)
  }

  const handleReferenceUpload = (event) => {
    const [nextFile] = Array.from(event.target.files || [])

    if (nextFile) {
      onReferenceImageChange(nextFile)
    }

    event.target.value = ''
  }

  return (
    <div className="prompt-dock">
      <section className="prompt-panel" aria-label="创作输入框">
        <div className="prompt-meta-row" aria-label="当前模式提示">
          <span className="prompt-meta-mode">{selectedMode.label}</span>
          <p className="prompt-meta-copy">{selectedMode.helper}</p>
          <span className="prompt-meta-shortcut">Cmd/Ctrl + Enter</span>
        </div>

        {selectedMode.id === 'video' ? (
          <div className="prompt-mode-note" role="status" aria-live="polite">
            当前返回视频创意脚本、镜头描述和分镜建议，不直接生成视频文件。
          </div>
        ) : null}

        <label className="sr-only" htmlFor="jimeng-prompt-input">
          创作提示词
        </label>

        <div className="prompt-input-shell">
          <textarea
            id="jimeng-prompt-input"
            className="prompt-textarea"
            placeholder={selectedMode.placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
          />

          <div className="prompt-input-footer">
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
                className={`prompt-reference-entry${referenceImage ? ' is-active' : ''}`}
                onClick={() => uploadInputRef.current?.click()}
                aria-label={referenceImage ? '更换参考图' : '上传参考图'}
              >
                <span className="prompt-reference-entry-media" aria-hidden="true">
                  {referenceImage ? (
                    <img src={referenceImage.previewUrl} alt="" />
                  ) : (
                    <PlusIcon className="prompt-reference-entry-icon" />
                  )}
                </span>
                <span className="prompt-reference-entry-copy">
                  <strong>{referenceImage ? '参考图已添加' : '参考图'}</strong>
                  <small>
                    {referenceImage ? '点击更换图片' : '添加构图或风格参考'}
                  </small>
                </span>
              </button>
            </div>

            <button
              type="button"
              className="prompt-submit"
              onClick={handleSubmit}
              disabled={isGenerating}
              aria-busy={isGenerating}
              aria-label={
                isGenerating
                  ? selectedMode.generatingLabel
                  : selectedMode.submitLabel
              }
              title={
                isGenerating
                  ? selectedMode.generatingLabel
                  : selectedMode.submitLabel
              }
            >
              <ArrowUpIcon
                className={`prompt-submit-icon${isGenerating ? ' is-busy' : ''}`}
              />
            </button>
          </div>
        </div>

        <div className="prompt-toolbar">
          <div className="prompt-toolbar-group">
            <div className="prompt-mode-wrap" ref={modeMenuRef}>
              <button
                type="button"
                className={`prompt-utility-btn prompt-utility-btn--dropdown${
                  isModeMenuOpen ? ' is-active' : ''
                }`}
                aria-expanded={isModeMenuOpen}
                aria-controls="prompt-mode-menu"
                onClick={() => {
                  const nextOpen = !isModeMenuOpen
                  closeFloatingPanels()
                  setIsModeMenuOpen(nextOpen)
                }}
              >
                <span className="prompt-utility-copy">
                  <strong>模式</strong>
                  <small>{selectedMode.shortLabel}</small>
                </span>
                <ChevronDownIcon className="prompt-utility-icon" />
              </button>

              {isModeMenuOpen ? (
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
                        className={`prompt-mode-option${isSelected ? ' is-selected' : ''}`}
                        onClick={() => handleModeSelect(mode.id)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="prompt-mode-option-label">
                          {mode.label}
                        </span>
                        <span className="prompt-mode-option-helper">
                          {mode.helper}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="prompt-preference-wrap" ref={preferencePanelRef}>
              <button
                type="button"
                className={`prompt-utility-btn prompt-utility-btn--dropdown${
                  isPreferencePanelOpen ? ' is-active' : ''
                }`}
                aria-expanded={isPreferencePanelOpen}
                aria-controls="prompt-preference-panel"
                onClick={() => {
                  const nextOpen = !isPreferencePanelOpen
                  closeFloatingPanels()
                  setIsPreferencePanelOpen(nextOpen)
                }}
              >
                <span className="prompt-utility-copy">
                  <strong>偏好</strong>
                  <small>
                    {getAspectRatioLabel(preferences.aspectRatio)} /{' '}
                    {getClarityLabel(preferences.clarity)}
                  </small>
                </span>
                <ChevronDownIcon className="prompt-utility-icon" />
              </button>

              {isPreferencePanelOpen ? (
                <div
                  id="prompt-preference-panel"
                  className="prompt-floating-panel prompt-preference-panel"
                >
                  <div className="prompt-preference-group">
                    <div className="prompt-preference-label">
                      <span>比例</span>
                    </div>
                    <div className="prompt-choice-grid">
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`prompt-choice-chip${
                            preferences.aspectRatio === option.value
                              ? ' is-selected'
                              : ''
                          }`}
                          onClick={() =>
                            onPreferenceChange('aspectRatio', option.value)
                          }
                        >
                          <strong>{option.label}</strong>
                          <span>{option.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="prompt-preference-group">
                    <div className="prompt-preference-label">
                      <span>清晰度</span>
                    </div>
                    <div className="prompt-inline-options">
                      {CLARITY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`prompt-segment-btn${
                            preferences.clarity === option.value
                              ? ' is-selected'
                              : ''
                          }`}
                          onClick={() =>
                            onPreferenceChange('clarity', option.value)
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="prompt-preference-group">
                    <div className="prompt-preference-label">
                      <span>自动增强</span>
                    </div>
                    <button
                      type="button"
                      className={`prompt-toggle-btn${
                        preferences.autoEnhance ? ' is-selected' : ''
                      }`}
                      aria-pressed={preferences.autoEnhance}
                      onClick={() =>
                        onPreferenceChange(
                          'autoEnhance',
                          !preferences.autoEnhance,
                        )
                      }
                    >
                      <span className="prompt-toggle-track" aria-hidden="true">
                        <span className="prompt-toggle-knob" />
                      </span>
                      <span>
                        {preferences.autoEnhance ? '已开启' : '已关闭'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="prompt-strategy-bar" aria-label="主策略入口">
            {ASSIST_ACTIONS.map((action) => {
              const isBusy = activeAssistActionId === action.id

              return (
                <button
                  key={action.id}
                  type="button"
                  className={`prompt-strategy-btn${
                    isBusy ? ' is-active' : ''
                  }`}
                  onClick={() => onAssistAction(action.id)}
                  disabled={Boolean(activeAssistActionId) || isGenerating}
                >
                  <SparkIcon className="prompt-strategy-icon" />
                  <span>{isBusy ? '处理中...' : action.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {referenceImage ? (
          <div className="prompt-reference-preview-list" aria-label="参考图预览">
            <article className="prompt-reference-card">
              <img src={referenceImage.previewUrl} alt="已上传参考图预览" />
              <div className="prompt-reference-meta">
                <strong>{referenceImage.file.name}</strong>
                <span>
                  {Math.max(1, Math.round(referenceImage.file.size / 1024))} KB
                </span>
              </div>
              <button
                type="button"
                className="prompt-reference-remove"
                onClick={onReferenceImageRemove}
              >
                删除
              </button>
            </article>
          </div>
        ) : null}

        {assistResult ? (
          <div className={`prompt-assist-feedback is-${assistResult.tone || 'info'}`}>
            <div className="prompt-assist-feedback-copy">
              <strong>{assistResult.title}</strong>
              <p>{assistResult.summary}</p>
              {assistResult.generatedText ? (
                <div className="prompt-assist-feedback-text">
                  {assistResult.generatedText}
                </div>
              ) : null}
            </div>
            <div className="prompt-assist-feedback-actions">
              {assistResult.canUndo ? (
                <button
                  type="button"
                  className="prompt-assist-feedback-btn"
                  onClick={onAssistUndo}
                >
                  恢复上一步
                </button>
              ) : null}
              <button
                type="button"
                className="prompt-assist-feedback-btn"
                onClick={onAssistDismiss}
              >
                收起
              </button>
            </div>
          </div>
        ) : null}

        <ErrorAlert error={error} onRetry={onRetry} />
      </section>
    </div>
  )
}
