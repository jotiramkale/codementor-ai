// Generic bordered section container with an optional header — the
// building block for every card-like grouping from here on, so
// Dashboard, Problems, Progress etc. don't each invent their own.
function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export default Panel
