function StatCard({ label, value, sublabel }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-zinc-50">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-zinc-500">{sublabel}</p>}
    </div>
  )
}

export default StatCard
