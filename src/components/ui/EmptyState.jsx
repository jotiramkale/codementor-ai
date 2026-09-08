// Used by every placeholder page so "not built yet" looks and reads the
// same everywhere, and is honest about it rather than faking content.
function EmptyState({ icon: Icon, title, description, phaseNote }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
      {Icon && <Icon className="mb-4 h-8 w-8 text-zinc-600" />}
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-500">{description}</p>}
      {phaseNote && <p className="mt-4 text-xs text-zinc-600">{phaseNote}</p>}
    </div>
  )
}

export default EmptyState
