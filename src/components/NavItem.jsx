import { NavLink } from 'react-router-dom'

function NavItem({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-zinc-900 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              'h-[18px] w-[18px] shrink-0',
              isActive ? (item.accent === 'ai' ? 'text-indigo-400' : 'text-amber-400') : 'text-zinc-500',
            ].join(' ')}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default NavItem
