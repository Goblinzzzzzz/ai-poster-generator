import './PromptInput.css'

export default function PromptInput({
  value,
  onChange,
  onSubmit,
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

  return (
    <div className="prompt-dock">
      <section className="prompt-panel">
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

        <label className="sr-only" htmlFor="jimeng-prompt-input">
          创作提示词
        </label>

        <textarea
          id="jimeng-prompt-input"
          className="prompt-textarea"
          placeholder="描述主体、材质、光线、配色和构图，例如：高端护肤产品，玻璃器皿，柔和晨光，冷白配色，极简留白。"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
        />

        <div className="prompt-footer">
          <div className="prompt-status">
            <span>{value.trim().length} 字</span>
            <span>Ctrl / Command + Enter 快速生成</span>
            <span>建议避免政治、暴力、成人或违法相关词语</span>
            {error ? (
              <span className="prompt-error" role="alert">
                {error}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className="prompt-submit"
            onClick={onSubmit}
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
