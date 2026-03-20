import { useState } from 'react'
import './TopBar.css'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.75 7.25h14.5M4.75 12h14.5M4.75 16.75h14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.75 4.75a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm8.5 14.5-3.4-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.75 4.25v-1.5M17.25 4.25v-1.5M5.25 7.75h13.5M4.75 20.75h14.5a1.5 1.5 0 0 0 1.5-1.5V7.25a1.5 1.5 0 0 0-1.5-1.5H4.75a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m8 10 4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TopBar({
  viewLabel,
  viewDescription,
  isNavDrawerOpen,
  onMenuToggle,
  searchValue,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  timeOptions,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      setTimeout(() => document.getElementById('topbar-search-input')?.focus(), 100)
    }
  }

  const handleTimeToggle = () => {
    setIsTimeOpen(!isTimeOpen)
  }

  const handleTimeSelect = (value) => {
    onTimeFilterChange(value)
    setIsTimeOpen(false)
  }

  return (
    <header className={`topbar${isSearchOpen || isTimeOpen ? ' has-active-dropdown' : ''}`}>
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu"
          onClick={onMenuToggle}
          aria-label={isNavDrawerOpen ? '关闭导航菜单' : '打开导航菜单'}
          aria-expanded={isNavDrawerOpen}
          aria-controls="mobile-sidebar-drawer"
        >
          <MenuIcon />
        </button>

        <div className="topbar-heading">
          <h1 className="topbar-title">{viewLabel}</h1>
          {viewDescription && <p className="topbar-description">{viewDescription}</p>}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search-wrap">
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={handleSearchToggle}
            aria-label="搜索作品"
          >
            <SearchIcon />
          </button>

          {isSearchOpen && (
            <div className="topbar-search-dropdown">
              <input
                id="topbar-search-input"
                type="text"
                className="topbar-search-input"
                placeholder="搜索作品..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={() => !searchValue && setIsSearchOpen(false)}
              />
            </div>
          )}
        </div>

        <div className="topbar-time-wrap">
          <button
            type="button"
            className={`topbar-icon-btn${isTimeOpen ? ' is-active' : ''}`}
            onClick={handleTimeToggle}
            aria-label="筛选时间"
          >
            <CalendarIcon />
          </button>

          {isTimeOpen && (
            <div className="topbar-time-dropdown">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`topbar-time-option${timeFilter === option.value ? ' is-active' : ''}`}
                  onClick={() => handleTimeSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="topbar-user">
          <button type="button" className="topbar-user-btn" aria-label="用户菜单">
            <span className="topbar-user-avatar">LU</span>
            <span className="topbar-user-info">
              <strong>Lucky</strong>
              <span>专业版</span>
            </span>
            <ChevronIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
