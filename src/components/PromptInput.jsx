import ErrorAlert from './ErrorAlert'
import './PromptInput.css'

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
}) {
  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()

      if (!isGenerating) {
        onSubmit()
      }
    }
  }

  const handleSubmit = () => {
    if (!isGenerating) {
      onSubmit()
    }
  }

  return (
    <div className="prompt-dock">
      <section className="prompt-panel">
        <div className="prompt-guide">
          描述你想要的画面，AI 帮你实现
        </div>

        <div className="prompt-shortcuts" aria-label="快捷模式">
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

        <div className="prompt-features" aria-label="功能入口">
          <button type="button" className="prompt-feature-btn">
            🎨 图片生成
          </button>
          <button type="button" className="prompt-feature-btn">
            🎬 视频生成
          </button>
          <button type="button" className="prompt-feature-btn">
            ✨ 文案优化
          </button>
        </div>

        <label className="sr-only" htmlFor="jimeng-prompt-input">
          创作提示词
        </label>

        <textarea
          id="jimeng-prompt-input"
          className="prompt-textarea"
          placeholder="描述主体、场景、风格，例如：一只猫咪在窗台上晒太阳，温暖的光线，治愈系配色"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
        />

        <ErrorAlert error={error} onRetry={onRetry} />

        <div className="prompt-footer">
          <div className="prompt-status">
            <span>{value.trim().length} 字</span>
            <span>Ctrl / Command + Enter 快速生成</span>
            <span>建议避免政治、暴力、成人或违法相关词语</span>
          </div>

          <button
            type="button"
            className="prompt-submit"
            onClick={handleSubmit}
            disabled={isGenerating}
            aria-busy={isGenerating}
          >
            <span className="prompt-submit-icon" aria-hidden="true">
              ↑
            </span>
            <span>{isGenerating ? '生成中...' : '发送'}</span>
          </button>
        </div>
      </section>
    </div>
  )
}
