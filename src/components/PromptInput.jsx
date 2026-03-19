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
          placeholder="Seedance 2.0 全能参考，上传参考、输入文字，创意无限可能"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
        />

        <div className="prompt-footer">
          <div className="prompt-status">
            <span>{value.trim().length} 字</span>
            <span>Ctrl / Command + Enter 快速生成</span>
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
