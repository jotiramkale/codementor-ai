import { useAuth } from '../context/AuthContext.jsx'
import Panel from '../components/ui/Panel.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import { toneForDifficulty, barColorForDifficulty } from '../utils/difficulty.js'
import {
  MOCK_STATS,
  MOCK_DIFFICULTY_PROGRESS,
  MOCK_RECENT_ACTIVITY,
  MOCK_RECOMMENDED_PROBLEMS,
  MOCK_WEAK_TOPICS,
  MOCK_AI_DAILY_PLAN,
  MOCK_RECENT_AI_FEEDBACK,
} from '../data/dashboardMockData.js'

function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Everything below is demo data — nothing here comes from a real account yet.
        </p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Problems solved"
          value={MOCK_STATS.problemsSolved}
          sublabel={`of ${MOCK_STATS.totalProblems}`}
        />
        <StatCard label="Accuracy" value={`${MOCK_STATS.accuracy}%`} />
        <StatCard label="Current streak" value={`${MOCK_STATS.currentStreak} days`} />
        <StatCard label="Avg. solving time" value={MOCK_STATS.averageSolvingTime} />
        <StatCard label="Total submissions" value={MOCK_STATS.totalSubmissions} />
      </div>

      <Panel title="Learning progress" className="mb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {MOCK_DIFFICULTY_PROGRESS.map((item) => (
            <div key={item.difficulty}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-zinc-300">{item.difficulty}</span>
                <span className="text-zinc-500">
                  {item.solved}/{item.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${barColorForDifficulty(item.difficulty)}`}
                  style={{ width: `${Math.round((item.solved / item.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Recent activity">
            <ul className="flex flex-col divide-y divide-zinc-800">
              {MOCK_RECENT_ACTIVITY.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-200">{item.problem}</p>
                    <p className="text-xs text-zinc-500">{item.when}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={toneForDifficulty(item.difficulty)}>{item.difficulty}</Badge>
                    <Badge tone={item.status === 'Solved' ? 'success' : 'neutral'}>{item.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recommended for you">
            <ul className="flex flex-col divide-y divide-zinc-800">
              {MOCK_RECOMMENDED_PROBLEMS.map((problem) => (
                <li key={problem.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-200">{problem.title}</p>
                    <Badge tone={toneForDifficulty(problem.difficulty)}>{problem.difficulty}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{problem.reason}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="AI daily plan" action={<Badge tone="ai">AI</Badge>}>
            <p className="text-sm text-zinc-300">{MOCK_AI_DAILY_PLAN.summary}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {MOCK_AI_DAILY_PLAN.steps.map((step, index) => (
                <li key={index} className="flex gap-2 text-sm text-zinc-400">
                  <span className="text-indigo-400">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Weak topics">
            <ul className="flex flex-col gap-3">
              {MOCK_WEAK_TOPICS.map((item) => (
                <li key={item.topic}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{item.topic}</span>
                    <span className="text-zinc-500">{item.accuracy}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${item.accuracy}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent AI feedback" action={<Badge tone="ai">AI</Badge>}>
            <ul className="flex flex-col divide-y divide-zinc-800">
              {MOCK_RECENT_AI_FEEDBACK.map((item) => (
                <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="text-sm text-zinc-200">{item.problem}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{item.note}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
