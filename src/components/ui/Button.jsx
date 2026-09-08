const VARIANTS = {
  primary: 'bg-amber-400 text-zinc-950 hover:bg-amber-300',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-900',
  ai: 'bg-indigo-400 text-zinc-950 hover:bg-indigo-300',
}

function Button({ variant = 'primary', className = '', disabled = false, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
