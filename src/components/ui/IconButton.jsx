function IconButton({ icon: Icon, label, badge = false, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 ${className}`}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" />
      {badge && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" />}
    </button>
  )
}

export default IconButton
