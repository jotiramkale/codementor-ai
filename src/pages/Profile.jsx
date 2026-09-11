import { useEffect, useState } from 'react'
import { FiUser } from 'react-icons/fi'
import Panel from '../components/ui/Panel.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMemory } from '../services/userService.js'

// Phase 14: real AI Memory content, replacing the placeholder. Account
// details come from AuthContext (the real mock session) rather than a
// duplicate service call — there's no backend profile endpoint to call
// yet. Memory is fetched scoped to the signed-in user's email as their
// user_id stand-in — see userService.js for why that scoping matters.
function Profile() {
  const { user } = useAuth()
  const [memory, setMemory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    getMemory(user?.email).then((result) => {
      if (!isCancelled) {
        setMemory(result)
        setIsLoading(false)
      }
    })
    return () => {
      isCancelled = true
    }
  }, [user?.email])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Your account and what the AI Mentor has learned about you.</p>
      </header>

      <Panel title="Account" className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-indigo-300">
            <FiUser className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-200">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>
      </Panel>

      <Panel title="AI Memory" action={<Badge tone="ai">AI</Badge>}>
        <p className="mb-4 text-xs text-zinc-500">
          Demo data, scoped to your account — not derived from any real activity yet. Structured facts
          (solved counts, streaks) will live in PostgreSQL and qualitative observations like these in
          ChromaDB once the real backend exists.
        </p>

        {isLoading || !memory ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Strengths</p>
              <ul className="flex flex-col gap-2">
                {memory.strengths.map((item) => (
                  <li key={item.topic} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
                    <span className="text-sm text-emerald-300">{item.topic}</span>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.note}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Weak areas</p>
              <ul className="flex flex-col gap-2">
                {memory.weakAreas.map((item) => (
                  <li key={item.topic} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
                    <span className="text-sm text-zinc-200">{item.topic}</span>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.note}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Learned patterns</p>
              <ul className="list-inside list-disc text-sm text-zinc-400">
                {memory.patterns.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Recent observations</p>
              <ul className="flex flex-col gap-1.5 text-sm text-zinc-400">
                {memory.recentObservations.map((item, index) => (
                  <li key={index}>
                    <span className="text-zinc-600">{item.when}:</span> {item.note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}

export default Profile
