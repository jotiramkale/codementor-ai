const TONES = {
  ai: 'bg-indigo-400/10 text-indigo-300',
  neutral: 'bg-zinc-800 text-zinc-300',
  success: 'bg-emerald-400/10 text-emerald-300',
  warning: 'bg-yellow-400/10 text-yellow-300',
  danger: 'bg-red-400/10 text-red-300',
}

function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
