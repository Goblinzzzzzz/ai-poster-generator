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
  mediaFilter,
  onMediaFilterChange,
  mediaOptions,
  actionFilter,
  onActionFilterChange,
  actionOptions,
}) {
  return (
    <header className="topbar">
      <div className="topbar-heading">
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

        <span className="topbar-view-pill">{viewLabel}</span>
        <div>
          <h1 className="topbar-title">即梦式创作时间线</h1>
          <p className="topbar-description">{viewDescription}</p>
        </div>
      </div>

      <div className="topbar-controls">
        <label className="topbar-search">
          <span className="topbar-search-icon">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索提示词、作者或作品"
            aria-label="搜索作品"
          />
        </label>

        <div className="topbar-select-wrap">
          <select value={timeFilter} onChange={(event) => onTimeFilterChange(event.target.value)}>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="topbar-select-icon">
            <ChevronIcon />
          </span>
        </div>

        <div className="topbar-select-wrap">
          <select value={mediaFilter} onChange={(event) => onMediaFilterChange(event.target.value)}>
            {mediaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="topbar-select-icon">
            <ChevronIcon />
          </span>
        </div>

        <div className="topbar-select-wrap">
          <select value={actionFilter} onChange={(event) => onActionFilterChange(event.target.value)}>
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="topbar-select-icon">
            <ChevronIcon />
          </span>
        </div>

        <button type="button" className="topbar-user">
          <span className="topbar-user-avatar">LU</span>
          <span className="topbar-user-copy">
            <strong>Lucky</strong>
            <small>专业版</small>
          </span>
          <span className="topbar-user-chevron">
            <ChevronIcon />
          </span>
        </button>
      </div>
    </header>
  )
}
