// Deliberately plain and centered — distinct from AppShell, since a
// signed-out visitor has no sidebar/topbar to show yet.
function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 font-display text-lg font-semibold text-amber-400">
            C
          </div>
          <h1 className="text-xl font-semibold text-zinc-50">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">{children}</div>
      </div>
    </div>
  )
}

export default AuthLayout
