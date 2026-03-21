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
}) {
  const [selectedModeId, setSelectedModeId] = useState(MODE_OPTIONS[0].id)
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
    setSelectedModeId(modeId)
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
        <label className="sr-only" htmlFor="jimeng-prompt-input">
          创作提示词
        </label>

        <textarea
          id="jimeng-prompt-input"
          className="prompt-textarea"
          placeholder={selectedMode.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
        />

        <div className="prompt-toolbar">
          <div className="prompt-strategy-bar" aria-label="主策略入口">
            {ASSIST_ACTIONS.map((action) => {
              const isBusy = activeAssistActionId === action.id
              const helperText =
                action.id === 'reference'
                  ? referenceImage
                    ? action.helperWithImage
                    : action.helperWithoutImage
                  : action.helper

              return (
                <button
                  key={action.id}
                  type="button"
                  className={`prompt-strategy-btn prompt-strategy-btn--${action.id}${
                    isBusy ? ' is-active' : ''
                  }`}
                  data-action={action.id}
                  onClick={() => onAssistAction(action.id)}
                  disabled={Boolean(activeAssistActionId) || isGenerating}
                >
                  <span className="prompt-strategy-copy">
                    <strong>{isBusy ? '处理中...' : action.label}</strong>
                    <small>{helperText}</small>
                  </span>
                  <span className="prompt-strategy-mode">{action.modeLabel}</span>
                </button>
              )
            })}
          </div>

          <div className="prompt-toolbar-actions">
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
                className={`prompt-utility-btn${referenceImage ? ' is-active' : ''}`}
                onClick={() => uploadInputRef.current?.click()}
              >
                <span>{referenceImage ? '参考图已添加' : '上传参考图'}</span>
              </button>
            </div>

            <div className="prompt-mode-wrap" ref={modeMenuRef}>
              <button
                type="button"
                className={`prompt-utility-btn${isModeMenuOpen ? ' is-active' : ''}`}
                aria-expanded={isModeMenuOpen}
                aria-controls="prompt-mode-menu"
                onClick={() => {
                  const nextOpen = !isModeMenuOpen
                  closeFloatingPanels()
                  setIsModeMenuOpen(nextOpen)
                }}
              >
                <span>模式</span>
                <span className="prompt-utility-summary">
                  {selectedMode.shortLabel}
                </span>
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
                className={`prompt-utility-btn${isPreferencePanelOpen ? ' is-active' : ''}`}
                aria-expanded={isPreferencePanelOpen}
                aria-controls="prompt-preference-panel"
                onClick={() => {
                  const nextOpen = !isPreferencePanelOpen
                  closeFloatingPanels()
                  setIsPreferencePanelOpen(nextOpen)
                }}
              >
                <span>偏好</span>
                <span className="prompt-utility-summary">
                  {getAspectRatioLabel(preferences.aspectRatio)} /{' '}
                  {getClarityLabel(preferences.clarity)}
                </span>
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

            <button
              type="button"
              className="prompt-submit"
              onClick={handleSubmit}
              disabled={isGenerating}
              aria-busy={isGenerating}
            >
              {isGenerating ? selectedMode.generatingLabel : selectedMode.submitLabel}
            </button>
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
