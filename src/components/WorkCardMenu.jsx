import { useEffect, useRef } from 'react'
import './WorkCardMenu.css'

const MENU_ITEMS = [
  { id: 'regenerate', label: '重新生成' },
  { id: 'edit', label: '编辑' },
  { id: 'download', label: '下载' },
  { id: 'delete', label: '删除', danger: true },
]

export default function WorkCardMenu({ isOpen, onClose, onAction }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div ref={menuRef} className="work-card-menu" role="menu" aria-label="作品更多操作">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`work-card-menu-item${item.danger ? ' is-danger' : ''}`}
          role="menuitem"
          onClick={() => {
            onAction(item.id)
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
