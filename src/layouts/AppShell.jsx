import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import TopBar from '../components/TopBar.jsx'
import MobileDrawer from '../components/MobileDrawer.jsx'

// The chrome built in Phase 2. Every page in src/pages/ renders inside
// the <Outlet/> below — pages don't repeat navigation or layout code.
function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setIsMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
