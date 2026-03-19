import { NAV_ICONS } from './navIcons'
import './Sidebar.css'

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

export default function Sidebar({
  items,
  selectedItem,
  onSelect,
  variant = 'desktop',
  isOpen = false,
  onClose,
  ...rest
}) {
  const isDrawer = variant === 'drawer'

  const handleSelect = (itemId) => {
    onSelect(itemId)

    if (isDrawer) {
      onClose?.()
    }
  }

  return (
    <aside
      className={`sidebar sidebar--${variant}${isOpen ? ' is-open' : ''}`}
      aria-label={isDrawer ? '导航抽屉' : '侧边导航'}
      role={isDrawer ? 'dialog' : undefined}
      aria-modal={isDrawer ? 'true' : undefined}
      {...rest}
    >
      <div className="sidebar-head">
        <div className="sidebar-logo" aria-label="即梦风格工作台">
          J
        </div>

        {isDrawer ? (
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="关闭导航"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <nav className="sidebar-nav" aria-label="主导航">
        {items.map((item) => {
          const isActive = item.id === selectedItem

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item${isActive ? ' is-active' : ''}`}
              onClick={() => handleSelect(item.id)}
              aria-pressed={isActive}
              title={item.label}
            >
              <span className="sidebar-icon">{NAV_ICONS[item.id]}</span>
              <span className="sidebar-copy">
                <span className="sidebar-label">{item.label}</span>
                {isDrawer ? <span className="sidebar-description">{item.description}</span> : null}
              </span>
            </button>
          )
        })}
      </nav>

      <button type="button" className="sidebar-profile" title="用户中心">
        <span className="sidebar-profile-avatar">LU</span>
      </button>
    </aside>
  )
}
