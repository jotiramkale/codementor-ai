import { useEffect, useRef, useState } from 'react'
import { FiBell } from 'react-icons/fi'
import IconButton from './ui/IconButton.jsx'

// No notification system exists yet, so this shows a real empty state
// rather than inventing sample notifications that could be mistaken for
// real data.
function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <IconButton icon={FiBell} label="Notifications" onClick={() => setIsOpen((v) => !v)} />

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
          <h3 className="mb-1 text-sm font-semibold text-zinc-100">Notifications</h3>
          <p className="text-sm text-zinc-500">
            You're all caught up. Submission and AI review notifications will appear here once those
            features exist.
          </p>
        </div>
      )}
    </div>
  )
}

export default NotificationsMenu
