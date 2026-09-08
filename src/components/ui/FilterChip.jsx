function FilterChip({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export default FilterChip
