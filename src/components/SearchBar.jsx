import { FiSearch } from 'react-icons/fi'

// Search (module #24) isn't phased in yet. Disabled rather than silently
// accepting input that goes nowhere — matches the "no broken buttons"
// quality bar.
function SearchBar({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="text"
        disabled
        placeholder="Search — coming soon"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-500 disabled:cursor-not-allowed"
      />
    </div>
  )
}

export default SearchBar
