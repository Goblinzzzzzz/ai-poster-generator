import './ErrorAlert.css'

export default function ErrorAlert({ error, onRetry }) {
  if (!error) {
    return null
  }

  return (
    <div className={`error-alert is-${error.type || 'other'}`} role="alert" aria-live="assertive">
      <div className="error-alert-copy">
        <strong>{error.title}</strong>
        <p>{error.message}</p>
        {error.hint ? <span>{error.hint}</span> : null}
      </div>

      {error.retryable ? (
        <button type="button" className="error-alert-retry" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  )
}
