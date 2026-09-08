import { FiMenu } from 'react-icons/fi'
import IconButton from './ui/IconButton.jsx'
import SearchBar from './SearchBar.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import ProfileMenu from './ProfileMenu.jsx'

function TopBar({ onOpenMenu }) {
  return (
    <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur md:px-6">
      <IconButton icon={FiMenu} label="Open menu" onClick={onOpenMenu} className="md:hidden" />

      <span className="font-display text-[15px] font-semibold text-zinc-50 md:hidden">CodeMentor AI</span>

      <SearchBar className="hidden max-w-sm flex-1 md:block" />

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  )
}

export default TopBar
