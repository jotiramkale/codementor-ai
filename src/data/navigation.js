import { FiAward, FiCode, FiCpu, FiGrid, FiTerminal, FiTrendingUp, FiUser } from 'react-icons/fi'

// Single source of truth for primary navigation, so the desktop sidebar
// and mobile drawer can never drift apart. `accent: 'ai'` marks the one
// item that represents AI-generated content rather than the learner's
// own work — it gets the indigo accent instead of amber when active.
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: FiGrid },
  { label: 'Problems', path: '/problems', icon: FiCode },
  { label: 'Practice', path: '/practice', icon: FiTerminal },
  { label: 'AI Mentor', path: '/ai-mentor', icon: FiCpu, accent: 'ai' },
  { label: 'Interview', path: '/interview', icon: FiAward },
  { label: 'Progress', path: '/progress', icon: FiTrendingUp },
  { label: 'Profile', path: '/profile', icon: FiUser },
]
