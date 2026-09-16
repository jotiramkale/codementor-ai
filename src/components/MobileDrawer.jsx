import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { NAV_ITEMS } from '../data/navigation.js'
import NavItem from './NavItem.jsx'

// The one deliberate motion moment on mobile: a slide-in drawer with a
// dimmed overlay. No per-item hover animations elsewhere in the shell.
function MobileDrawer({ isOpen, onClose }) {
  const { user } = useAuth()
  const visibleItems = NAV_ITEMS.filter((item) => !item.requiresAdmin || user?.role === 'admin')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-950 px-3 py-5 md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
          >
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="font-display text-[15px] font-semibold text-zinc-50">CodeMentor AI</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {visibleItems.map((item) => (
                <NavItem key={item.path} item={item} onNavigate={onClose} />
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileDrawer
