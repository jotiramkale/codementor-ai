import { Link } from 'react-router-dom'
import Badge from './ui/Badge.jsx'
import { toneForDifficulty } from '../utils/difficulty.js'

function ProblemCard({ problem }) {
  return (
    <Link
      to={`/problems/${problem.id}`}
      className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-100">{problem.title}</h3>
          <Badge tone={toneForDifficulty(problem.difficulty)}>{problem.difficulty}</Badge>
          {problem.aiRecommended && <Badge tone="ai">AI pick</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{problem.topic}</span>
          <span>Est. {problem.estimatedTime}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-xs text-zinc-500">
        <div className="text-center">
          <p className="text-sm text-zinc-300">{problem.attempts}</p>
          <p>{problem.attempts === 1 ? 'attempt' : 'attempts'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-zinc-300">{problem.bestTime || '—'}</p>
          <p>best time</p>
        </div>
        <Badge tone={problem.solved ? 'success' : 'neutral'}>{problem.solved ? 'Solved' : 'Unsolved'}</Badge>
      </div>
    </Link>
  )
}

export default ProblemCard
