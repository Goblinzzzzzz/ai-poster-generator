import { useEffect, useRef, useState } from 'react'
import GeneratingCard from './GeneratingCard'
import WorkCard from './WorkCard'
import './TimelineFeed.css'

const INITIAL_VISIBLE_COUNT = 8
const LOAD_MORE_STEP = 6

const groupWorksByDate = (works) => {
  const grouped = new Map()

  works.forEach((work) => {
    if (!grouped.has(work.dateLabel)) {
      grouped.set(work.dateLabel, [])
    }

    grouped.get(work.dateLabel).push(work)
  })

  return Array.from(grouped.entries()).map(([dateLabel, items]) => ({
    dateLabel,
    items,
  }))
}

export default function TimelineFeed({
  works,
  hasAnyWorks,
  activeViewLabel,
  searchValue,
  resetKey,
  onWorkOpen,
  onWorkDownload,
  onWorkRegenerate,
  onWorkEdit,
  onWorkDelete,
  onStartCreate,
  onSuggestionSelect,
  suggestions = [],
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const sentinelRef = useRef(null)

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [resetKey])

  useEffect(() => {
    if (!sentinelRef.current || visibleCount >= works.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, works.length))
        }
      },
      {
        rootMargin: '220px 0px',
      },
    )

    observer.observe(sentinelRef.current)

    return () => observer.disconnect()
  }, [visibleCount, works.length])

  const visibleWorks = works.slice(0, visibleCount)
  const groupedWorks = groupWorksByDate(visibleWorks)

  if (!works.length) {
    const hasFilters = Boolean(searchValue)

    return (
      <section className="timeline-feed timeline-feed-empty">
        <div className="timeline-empty-card">
          <span className="timeline-empty-badge">{activeViewLabel}</span>
          {hasAnyWorks ? (
            <>
              <h2>当前筛选下还没有作品</h2>
              <p>{hasFilters ? '尝试减少关键词或切换筛选条件。' : '切换导航或调整筛选条件后再试。'}</p>
            </>
          ) : (
            <>
              <h2>还没有作品</h2>
              <p>开始你的第一个创作。输入一句清晰的主体、材质、光线和构图描述，就会出现在上方时间线。</p>
              <button
                type="button"
                className="timeline-empty-primary"
                onClick={onStartCreate}
              >
                开始你的第一个创作
              </button>
              {suggestions.length ? (
                <div className="timeline-empty-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="timeline-empty-suggestion"
                      onClick={() => onSuggestionSelect?.(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="timeline-feed">
      <div className="timeline-feed-header">
        <div>
          <span className="timeline-kicker">时间线</span>
          <h2>按时间回看最近的创作输出</h2>
        </div>
        <p>卡片流会持续加载，保留即梦网页端那种向下浏览作品的节奏。</p>
      </div>

      {groupedWorks.map((group) => (
        <section key={group.dateLabel} className="timeline-group">
          <header className="timeline-group-header">
            <h3>{group.dateLabel}</h3>
            <span>{group.items.length} 个作品</span>
          </header>

          <div className="timeline-grid">
            {group.items.map((work) => (
              work.status === 'generating' ? (
                <GeneratingCard
                  key={work.id}
                  work={work}
                  onEdit={onWorkEdit}
                />
              ) : (
                <WorkCard
                  key={work.id}
                  work={work}
                  onOpen={onWorkOpen}
                  onDownload={onWorkDownload}
                  onRegenerate={onWorkRegenerate}
                  onEdit={onWorkEdit}
                  onDelete={onWorkDelete}
                />
              )
            ))}
          </div>
        </section>
      ))}

      {visibleCount < works.length ? (
        <div ref={sentinelRef} className="timeline-load-more" aria-hidden="true">
          正在加载更多作品...
        </div>
      ) : (
        <div className="timeline-end">已展示全部作品</div>
      )}
    </section>
  )
}
