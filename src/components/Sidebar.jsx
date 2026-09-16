import { useAuth } from '../context/AuthContext.jsx'
import { NAV_ITEMS } from '../data/navigation.js'
import NavItem from './NavItem.jsx'

function Sidebar() {
  const { user } = useAuth()
  const visibleItems = NAV_ITEMS.filter((item) => !item.requiresAdmin || user?.role === 'admin')

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-zinc-800 md:bg-zinc-950 md:px-3 md:py-5">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 font-display text-sm font-semibold text-amber-400">
          C
        </div>
        <span className="font-display text-[15px] font-semibold text-zinc-50">CodeMentor AI</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      <div className="mt-4 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        CodeMentor AI — demo build, Phase 18
      </div>
    </aside>
  )
}

export default Sidebar
