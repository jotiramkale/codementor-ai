import { useMemo, useState } from 'react'
import Panel from '../components/ui/Panel.jsx'
import FilterChip from '../components/ui/FilterChip.jsx'
import ProblemCard from '../components/ProblemCard.jsx'
import { TOPICS, DIFFICULTIES } from '../data/problemsMockData.js'
import { getProblems } from '../data/problemStore.js'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
]

// All filtering happens client-side against the mock array — the real
// version queries the backend with these same filters (Phase 19+/20).
// Phase 18: reads from problemStore.js (not the static array directly)
// so an admin's create/edit/delete is reflected here.
function Problems() {
  const allProblems = getProblems()
  const [activeDifficulties, setActiveDifficulties] = useState(new Set())
  const [topic, setTopic] = useState('all')
  const [status, setStatus] = useState('all')
  const [aiRecommendedOnly, setAiRecommendedOnly] = useState(false)

  function toggleDifficulty(difficulty) {
    setActiveDifficulties((prev) => {
      const next = new Set(prev)
      if (next.has(difficulty)) {
        next.delete(difficulty)
      } else {
        next.add(difficulty)
      }
      return next
    })
  }

  const filteredProblems = useMemo(() => {
    return allProblems.filter((problem) => {
      if (activeDifficulties.size > 0 && !activeDifficulties.has(problem.difficulty)) return false
      if (topic !== 'all' && problem.topic !== topic) return false
      if (status === 'solved' && !problem.solved) return false
      if (status === 'unsolved' && problem.solved) return false
      if (aiRecommendedOnly && !problem.aiRecommended) return false
      return true
    })
  }, [allProblems, activeDifficulties, topic, status, aiRecommendedOnly])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">Problems</h1>
        <p className="mt-1 text-sm text-zinc-400">
          A demo catalog of {allProblems.length} problems — a real, backend-powered set arrives in Phase
          19+/20.
        </p>
      </header>

      <Panel className="mb-4">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((difficulty) => (
                <FilterChip
                  key={difficulty}
                  label={difficulty}
                  isActive={activeDifficulties.has(difficulty)}
                  onClick={() => toggleDifficulty(difficulty)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-300">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    isActive={status === option.value}
                    onClick={() => setStatus(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="topic" className="mb-2 block text-sm font-medium text-zinc-300">
                  Topic
                </label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-400"
                >
                  <option value="all">All topics</option>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 pb-0.5 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={aiRecommendedOnly}
                  onChange={(e) => setAiRecommendedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-400 focus:ring-indigo-400"
                />
                AI recommended only
              </label>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col gap-3">
        {filteredProblems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
            No problems match these filters.
          </div>
        ) : (
          filteredProblems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)
        )}
      </div>
    </div>
  )
}

export default Problems
