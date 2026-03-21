import { useEffect, useRef, useState } from 'react'
import ErrorAlert from './ErrorAlert'
import './PromptInput.css'

const MODE_OPTIONS = [
  {
    id: 'image',
    label: '图片生成',
    helper: '海报、插画、摄影感画面',
    placeholder:
      '描述主体、场景、构图与风格，例如：一只猫咪在窗台上晒太阳，电影感逆光，治愈系胶片色彩',
    submitLabel: '生成图片',
    generatingLabel: '生成图片中...',
  },
  {
    id: 'video',
    label: '视频生成',
    helper: '镜头运动、节奏、转场描述',
    placeholder:
      '描述画面变化、镜头语言与节奏，例如：清晨城市街道从远景推进到咖啡店橱窗，轻微手持感，慢节奏转场',
    submitLabel: '生成视频',
    generatingLabel: '生成视频中...',
  },
  {
    id: 'agent',
    label: 'Agent 模式',
    helper: '拆解复杂任务，组织创作步骤',
    placeholder:
      '描述目标、约束与希望 Agent 协助的任务，例如：为夏日饮品海报整理三套创意方向，并补充风格关键词与镜头建议',
    submitLabel: '生成方案',
    generatingLabel: '生成方案中...',
  },
]

const ASSIST_ACTIONS = [
  { id: 'scene', label: '场景强化' },
  { id: 'reference', label: '参考图思路' },
  { id: 'copy', label: '文案优化' },
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
  quickActions,
  activeQuickAction,
  onQuickActionChange,
  referenceImage,
  onReferenceImageChange,
  onReferenceImageRemove,
  preferences,
  onPreferenceChange,
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
    if (!isModeMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target)) {
        setIsModeMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsModeMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isModeMenuOpen])

  useEffect(() => {
    if (!isPreferencePanelOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (
        preferencePanelRef.current &&
        !preferencePanelRef.current.contains(event.target)
      ) {
        setIsPreferencePanelOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsPreferencePanelOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isPreferencePanelOpen])

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()

      if (!isGenerating) {
        onSubmit()
      }
    }

    if (event.key === 'Escape' && isModeMenuOpen) {
      setIsModeMenuOpen(false)
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
      <section className="prompt-panel" aria-label="创作工作台">
        <div className="prompt-panel-head">
          <div>
            <p className="prompt-eyebrow">创作工作台</p>
            <h2 className="prompt-title">把创意整理成可执行的生成描述</h2>
            <p className="prompt-guide">
              先选择主模式，再补充场景、风格和辅助能力。
            </p>
          </div>

          <div className="prompt-head-badge">{selectedMode.label}</div>
        </div>

        <div className="prompt-workbench">
          <section className="prompt-section prompt-section-main">
            <div className="prompt-section-heading">
              <span className="prompt-section-label">主输入区</span>
              <span className="prompt-section-note">
                围绕主体、场景、风格、镜头补充细节
              </span>
            </div>

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
              rows={5}
            />

            <div className="prompt-utility-row">
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
                  className={`prompt-tool-btn${referenceImage ? ' is-active' : ''}`}
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <span className="prompt-tool-btn-icon" aria-hidden="true">
                    +
                  </span>
                  <span>{referenceImage ? '更换参考图' : '上传参考图'}</span>
                </button>
              </div>

              <div className="prompt-preference-wrap" ref={preferencePanelRef}>
                <button
                  type="button"
                  className={`prompt-tool-btn${isPreferencePanelOpen ? ' is-active' : ''}`}
                  aria-expanded={isPreferencePanelOpen}
                  aria-controls="prompt-preference-panel"
                  onClick={() => setIsPreferencePanelOpen((open) => !open)}
                >
                  <span>偏好设置</span>
                  <span className="prompt-tool-btn-summary">
                    {getAspectRatioLabel(preferences.aspectRatio)} /{' '}
                    {getClarityLabel(preferences.clarity)} /{' '}
                    {preferences.autoEnhance ? '自动开' : '自动关'}
                  </span>
                </button>

                {isPreferencePanelOpen ? (
                  <div
                    id="prompt-preference-panel"
                    className="prompt-preference-panel"
                  >
                    <div className="prompt-preference-group">
                      <div className="prompt-preference-label">
                        <span>比例</span>
                        <small>控制画幅与卡片预览比例</small>
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
                        <small>当前先保留前端状态和软映射</small>
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
                        <span>自动</span>
                        <small>自动补全构图和光影倾向</small>
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
                          {preferences.autoEnhance ? '自动已开启' : '自动已关闭'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="prompt-reference-preview-list" aria-label="参考图预览">
              {referenceImage ? (
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
              ) : (
                <div className="prompt-reference-placeholder">
                  <strong>未添加参考图</strong>
                  <span>上传后会在这里显示缩略预览，可用于后续风格和构图控制。</span>
                </div>
              )}
            </div>
          </section>

          <section className="prompt-section prompt-section-mode">
            <div className="prompt-section-heading">
              <span className="prompt-section-label">主模式区</span>
              <span className="prompt-section-note">
                当前模式决定输入提示和主按钮语义
              </span>
            </div>

            <div className="prompt-mode-selector" ref={modeMenuRef}>
              <button
                type="button"
                className={`prompt-mode-trigger${isModeMenuOpen ? ' is-open' : ''}`}
                onClick={() => setIsModeMenuOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isModeMenuOpen}
                aria-controls="prompt-mode-menu"
              >
                <span className="prompt-mode-trigger-copy">
                  <span className="prompt-mode-trigger-label">
                    {selectedMode.label}
                  </span>
                  <span className="prompt-mode-trigger-helper">
                    {selectedMode.helper}
                  </span>
                </span>
                <span className="prompt-mode-trigger-arrow" aria-hidden="true">
                  ▾
                </span>
              </button>

              {isModeMenuOpen ? (
                <div
                  id="prompt-mode-menu"
                  className="prompt-mode-menu"
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
          </section>

          <section className="prompt-section prompt-section-tools">
            <div className="prompt-section-heading">
              <span className="prompt-section-label">场景 / 辅助能力区</span>
              <span className="prompt-section-note">
                先锁定创作场景，再叠加辅助能力
              </span>
            </div>

            <div className="prompt-chip-row" aria-label="快捷模式">
              {quickActions.map((action) => {
                const isActive = action.id === activeQuickAction

                return (
                  <button
                    key={action.id}
                    type="button"
                    className={`prompt-shortcut${isActive ? ' is-active' : ''}`}
                    onClick={() => onQuickActionChange(action.id)}
                  >
                    {action.label}
                  </button>
                )
              })}
            </div>

            <div className="prompt-chip-row prompt-chip-row-secondary" aria-label="辅助能力">
              {ASSIST_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="prompt-feature-btn"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <ErrorAlert error={error} onRetry={onRetry} />

          <section className="prompt-section prompt-footer">
            <div className="prompt-footer-copy">
              <div className="prompt-status">
                <span>{selectedMode.label}</span>
                <span>{value.trim().length} 字</span>
                <span>Ctrl / Command + Enter 快速生成</span>
              </div>
              <p className="prompt-safety-copy">
                建议避免政治、暴力、成人或违法相关词语。
              </p>
            </div>

            <button
              type="button"
              className="prompt-submit"
              onClick={handleSubmit}
              disabled={isGenerating}
              aria-busy={isGenerating}
            >
              <span className="prompt-submit-icon" aria-hidden="true">
                ✦
              </span>
              <span>
                {isGenerating ? selectedMode.generatingLabel : selectedMode.submitLabel}
              </span>
            </button>
          </section>
        </div>
      </section>
    </div>
  )
}
