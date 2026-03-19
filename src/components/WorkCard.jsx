import { useMemo, useState } from 'react'
import WorkCardMenu from './WorkCardMenu'
import './WorkCard.css'
import { getWorkPreviewSrc } from '../utils/download'

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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.75v9.5m0 0 3.75-3.75M12 14.25 8.25 10.5M5 18.25h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function WorkCard({
  work,
  onOpen,
  onDownload,
  onRegenerate,
  onEdit,
  onShare,
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const previewSrc = useMemo(
    () => (work.mediaKind === 'image' ? getWorkPreviewSrc(work) : ''),
    [work],
  )

  const handleMenuAction = (actionId) => {
    const actions = {
      regenerate: () => onRegenerate?.(work),
      edit: () => onEdit?.(work),
      share: () => onShare?.(work),
      download: () => onDownload?.(work),
      delete: () => onDelete?.(work.id),
    }

    actions[actionId]?.()
  }

  const handleOpen = () => {
    if (work.mediaKind === 'image') {
      onOpen?.(work.id)
    }
  }

  const handleMediaKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && work.mediaKind === 'image') {
      event.preventDefault()
      handleOpen()
    }
  }

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

        <div className="work-card-more-wrap">
          <button
            type="button"
            className="work-card-more"
            aria-label="更多操作"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <MoreIcon />
          </button>
          <WorkCardMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onAction={handleMenuAction}
          />
        </div>
      </div>

      <div
        className={`work-card-media${work.mediaKind === 'image' ? ' is-interactive' : ''}`}
        style={{ aspectRatio: work.aspectRatio }}
        onClick={handleOpen}
        onKeyDown={handleMediaKeyDown}
        role={work.mediaKind === 'image' ? 'button' : undefined}
        tabIndex={work.mediaKind === 'image' ? 0 : undefined}
        aria-label={work.mediaKind === 'image' ? `查看 ${work.headline} 大图` : undefined}
      >
        {work.mediaKind === 'image' ? (
          <img src={previewSrc} alt={work.headline} loading="lazy" />
        ) : (
          <div className="work-card-placeholder" style={{ background: work.surface }}>
            <span className="work-card-placeholder-badge">{work.mediaType}</span>
            <strong>{work.headline}</strong>
            <p>{work.tone}</p>
          </div>
        )}

        {work.mediaKind === 'image' ? (
          <span className="work-card-media-hint">点击查看大图</span>
        ) : null}

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
          <button type="button" onClick={() => onEdit?.(work)}>
            重新编辑
          </button>
          <button type="button" onClick={() => onRegenerate?.(work)}>
            再次生成
          </button>
          <button type="button" onClick={() => onDownload?.(work)}>
            <DownloadIcon />
            下载
          </button>
        </div>
      </div>
    </article>
  )
}
