import './WorkCard.css'

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 12a.75.75 0 1 0 0 .01V12Zm5.5 0a.75.75 0 1 0 0 .01V12Zm5.5 0a.75.75 0 1 0 0 .01V12Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 7 8 5-8 5z" fill="currentColor" />
    </svg>
  )
}

export default function WorkCard({ work }) {
  return (
    <article className="work-card">
      <div className="work-card-header">
        <div className="work-card-author">
          <span className="work-card-avatar">{work.avatar}</span>
          <div className="work-card-copy">
            <div className="work-card-meta">
              <strong>{work.author}</strong>
              <span>{work.createdAt}</span>
            </div>
            <p>{work.prompt}</p>
          </div>
        </div>

        <button type="button" className="work-card-more" aria-label="更多操作">
          <MoreIcon />
        </button>
      </div>

      <div className="work-card-media" style={{ aspectRatio: work.aspectRatio }}>
        {work.imageSrc ? (
          <img src={work.imageSrc} alt={work.headline} />
        ) : (
          <div className="work-card-placeholder" style={{ background: work.surface }}>
            <span className="work-card-placeholder-badge">{work.mediaType}</span>
            <strong>{work.headline}</strong>
            <p>{work.tone}</p>
          </div>
        )}

        {work.mediaKind === 'video' ? (
          <span className="work-card-play">
            <PlayIcon />
            预览
          </span>
        ) : null}
      </div>

      <div className="work-card-footer">
        <div className="work-card-tags">
          <span>{work.mediaType}</span>
          <span>{work.actionType}</span>
          <span>{work.headline}</span>
        </div>

        <div className="work-card-actions">
          <button type="button">重新编辑</button>
          <button type="button">再次生成</button>
          <button type="button">更多</button>
        </div>
      </div>
    </article>
  )
}
