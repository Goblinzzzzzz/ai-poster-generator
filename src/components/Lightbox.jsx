import { useEffect, useMemo, useRef, useState } from 'react'
import './Lightbox.css'
import { getWorkPreviewSrc } from '../utils/download'

const MIN_ZOOM = 1
const MAX_ZOOM = 4

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getDistance = (points) => {
  const [first, second] = points

  if (!first || !second) {
    return 0
  }

  return Math.hypot(second.x - first.x, second.y - first.y)
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.75 6.75 17.25 17.25M17.25 6.75 6.75 17.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowIcon({ direction = 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === 'right' ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export default function Lightbox({
  items,
  activeIndex,
  isOpen,
  onClose,
  onNavigate,
  onDownload,
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const pointersRef = useRef(new Map())
  const pinchStartDistanceRef = useRef(0)
  const pinchStartZoomRef = useRef(MIN_ZOOM)

  const currentItem = isOpen && activeIndex >= 0 ? items[activeIndex] : null
  const currentSrc = useMemo(
    () => (currentItem ? getWorkPreviewSrc(currentItem) : ''),
    [currentItem],
  )
  const canNavigate = items.length > 1

  useEffect(() => {
    if (!isOpen || !currentItem) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }

      if (canNavigate && event.key === 'ArrowLeft') {
        onNavigate((activeIndex - 1 + items.length) % items.length)
      }

      if (canNavigate && event.key === 'ArrowRight') {
        onNavigate((activeIndex + 1) % items.length)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, canNavigate, currentItem, isOpen, items.length, onClose, onNavigate])

  useEffect(() => {
    setZoom(MIN_ZOOM)
    pointersRef.current.clear()
    pinchStartDistanceRef.current = 0
    pinchStartZoomRef.current = MIN_ZOOM
  }, [activeIndex, isOpen])

  if (!isOpen || !currentItem) {
    return null
  }

  const handleWheel = (event) => {
    event.preventDefault()
    setZoom((current) => clamp(current - event.deltaY * 0.003, MIN_ZOOM, MAX_ZOOM))
  }

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'touch') {
      return
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pointersRef.current.size === 2) {
      pinchStartDistanceRef.current = getDistance(Array.from(pointersRef.current.values()))
      pinchStartZoomRef.current = zoom
    }
  }

  const handlePointerMove = (event) => {
    if (event.pointerType !== 'touch' || !pointersRef.current.has(event.pointerId)) {
      return
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pointersRef.current.size !== 2 || !pinchStartDistanceRef.current) {
      return
    }

    const nextDistance = getDistance(Array.from(pointersRef.current.values()))
    const nextZoom = pinchStartZoomRef.current * (nextDistance / pinchStartDistanceRef.current)
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM))
  }

  const handlePointerUp = (event) => {
    pointersRef.current.delete(event.pointerId)

    if (pointersRef.current.size < 2) {
      pinchStartDistanceRef.current = 0
      pinchStartZoomRef.current = zoom
    }
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片查看器"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="lightbox-toolbar">
        <div className="lightbox-toolbar-copy">
          <span className="lightbox-toolbar-index">
            {activeIndex + 1} / {items.length}
          </span>
          <strong>{currentItem.headline}</strong>
        </div>

        <div className="lightbox-toolbar-actions">
          <button type="button" onClick={() => setZoom((current) => (current > 1 ? 1 : 2))}>
            {zoom > 1 ? '重置' : '缩放'}
          </button>
          <button type="button" onClick={() => onDownload?.(currentItem)} aria-label="下载图片">
            <DownloadIcon />
          </button>
          <button type="button" onClick={onClose} aria-label="关闭查看器">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="lightbox-stage">
        {canNavigate ? (
          <button
            type="button"
            className="lightbox-nav lightbox-nav-prev"
            onClick={() => onNavigate((activeIndex - 1 + items.length) % items.length)}
            aria-label="查看上一张图片"
          >
            <ArrowIcon direction="left" />
          </button>
        ) : null}

        <div className="lightbox-media-wrap">
          <div
            className="lightbox-media"
            onDoubleClick={() => setZoom((current) => (current > 1 ? 1 : 2.5))}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              src={currentSrc}
              alt={currentItem.headline}
              style={{ transform: `scale(${zoom})` }}
              draggable="false"
            />
          </div>
        </div>

        {canNavigate ? (
          <button
            type="button"
            className="lightbox-nav lightbox-nav-next"
            onClick={() => onNavigate((activeIndex + 1) % items.length)}
            aria-label="查看下一张图片"
          >
            <ArrowIcon direction="right" />
          </button>
        ) : null}
      </div>

      <div className="lightbox-footer">
        <div>
          <h3>{currentItem.headline}</h3>
          <p>{currentItem.prompt}</p>
        </div>
        <span>{zoom.toFixed(1)}x</span>
      </div>
    </div>
  )
}
