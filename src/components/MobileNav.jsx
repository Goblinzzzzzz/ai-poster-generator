import { NAV_ICONS } from './navIcons'
import './MobileNav.css'

export default function MobileNav({ items, selectedItem, onSelect }) {
  return (
    <nav className="mobile-nav" aria-label="移动端主导航">
      <div className="mobile-nav-inner">
        {items.map((item) => {
          const isActive = item.id === selectedItem

          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item${isActive ? ' is-active' : ''}`}
              onClick={() => onSelect(item.id)}
              aria-pressed={isActive}
            >
              <span className="mobile-nav-icon">{NAV_ICONS[item.id]}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
