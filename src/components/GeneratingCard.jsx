import './WorkCard.css'
import './GeneratingCard.css'

export default function GeneratingCard({ work, onEdit }) {
  return (
    <article className="work-card generating-card" aria-busy="true">
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
      </div>

      <div className="work-card-media generating-card-media" style={{ aspectRatio: work.aspectRatio }}>
        <div className="generating-card-overlay">
          <span className="generating-card-spinner" aria-hidden="true" />
          <strong>生成中...</strong>
          <p>正在生成中，请稍候，完成后会自动替换为真实图片。</p>
        </div>
      </div>

      <div className="work-card-footer">
        <div className="work-card-tags">
          <span>{work.mediaType}</span>
          <span>{work.actionType}</span>
          <span>{work.headline}</span>
        </div>

        <div className="work-card-actions">
          <button type="button" onClick={() => onEdit?.(work)}>
            重新编辑
          </button>
          <button type="button" disabled>
            生成中
          </button>
          <button type="button" disabled>
            等待完成
          </button>
        </div>
      </div>
    </article>
  )
}
