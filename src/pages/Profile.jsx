import { useCallback, useEffect, useState } from 'react'
import { FiTrash2, FiUser } from 'react-icons/fi'
import Panel from '../components/ui/Panel.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { addMemory, deleteMemory, getMemory } from '../services/userService.js'

function Profile() {
  const { user } = useAuth()
  const [memory, setMemory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('observation')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const refreshMemory = useCallback(async () => {
    setError('')
    try { setMemory(await getMemory()) } catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { refreshMemory() }, [refreshMemory])

  async function saveMemory(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      await addMemory({ category, topic, content })
      setContent('')
      await refreshMemory()
    } catch (err) { setError(err.message) }
    finally { setIsSaving(false) }
  }

  async function removeMemory(id) {
    try { await deleteMemory(id); await refreshMemory() } catch (err) { setError(err.message) }
  }

  const groups = [
    { title: 'Strengths', category: 'strength', tone: 'text-emerald-300' },
    { title: 'Weak areas', category: 'weakness', tone: 'text-zinc-200' },
    { title: 'Learned patterns', category: 'pattern', tone: 'text-zinc-200' },
    { title: 'Preferences', category: 'preference', tone: 'text-zinc-200' },
    { title: 'Recent observations', category: 'observation', tone: 'text-zinc-200' },
  ]

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Your account and private learning notes for the AI Mentor.</p>
      </header>

      <Panel title="Account" className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-400/15 text-indigo-300"><FiUser className="h-5 w-5" /></div>
          <div><p className="text-sm text-zinc-200">{user?.name}</p><p className="text-xs text-zinc-500">{user?.email} · {user?.role}</p></div>
        </div>
      </Panel>

      <Panel title="AI Memory" action={<Badge tone="ai">Private to you</Badge>}>
        <p className="mb-4 text-xs text-zinc-500">These saved learning notes use your authenticated account. Relevant notes may be added as context in Mentor chats. Structured progress remains in PostgreSQL; semantic notes are stored in ChromaDB.</p>
        <form onSubmit={saveMemory} className="mb-4 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 sm:grid-cols-[140px_150px_1fr_auto]">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-200">
            <option value="observation">Observation</option><option value="strength">Strength</option><option value="weakness">Weak area</option><option value="pattern">Pattern</option><option value="preference">Preference</option>
          </select>
          <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={120} placeholder="Topic (optional)" className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-200" />
          <input value={content} onChange={(event) => setContent(event.target.value)} minLength={3} maxLength={2000} required placeholder="Write a learning note or preference…" className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-200" />
          <button disabled={isSaving} className="rounded-md bg-indigo-500 px-3 py-2 text-xs text-white disabled:opacity-50">{isSaving ? 'Saving…' : 'Save note'}</button>
        </form>
        {error && <p role="alert" className="mb-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</p>}
        {isLoading ? <p className="text-sm text-zinc-500">Loading private memory…</p> : !memory?.entries.length ? (
          <p className="text-sm text-zinc-500">No notes saved yet. Add one above to personalize future Mentor chats.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {groups.map((group) => {
              const entries = memory.entries.filter((item) => item.category === group.category)
              return <section key={group.category}>
                <p className="mb-2 text-xs font-medium text-zinc-500">{group.title}</p>
                {entries.length ? <ul className="flex flex-col gap-2">{entries.map((item) => <li key={item.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
                  <div><span className={`text-sm ${group.tone}`}>{item.topic || 'General'}</span><p className="mt-0.5 text-xs text-zinc-400">{item.content}</p><p className="mt-1 text-[10px] text-zinc-600">{new Date(item.created_at).toLocaleString()}</p></div>
                  <button type="button" onClick={() => removeMemory(item.id)} aria-label={`Delete ${group.title.toLowerCase()} note`} className="text-zinc-600 hover:text-red-300"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </li>)}</ul> : <p className="text-xs text-zinc-600">No {group.title.toLowerCase()} saved.</p>}
              </section>
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}

export default Profile
