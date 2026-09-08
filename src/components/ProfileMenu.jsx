import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiSettings, FiUser } from 'react-icons/fi'
import Avatar from './ui/Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function ProfileMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
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

  function handleSignOut() {
    signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-900"
      >
        <Avatar name={user?.name} size={28} />
        <FiChevronDown className="h-4 w-4 text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl">
          <p className="px-2.5 py-2 text-xs text-zinc-500">
            Signed in as <span className="text-zinc-300">{user?.email}</span>
          </p>
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <FiUser className="h-4 w-4" /> Profile
          </Link>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-500 disabled:cursor-not-allowed"
          >
            <FiSettings className="h-4 w-4" /> Settings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <FiLogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
