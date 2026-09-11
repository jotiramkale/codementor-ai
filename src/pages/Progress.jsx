import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Panel from '../components/ui/Panel.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import {
  MOCK_PROGRESS_STATS,
  MOCK_DIFFICULTY_DISTRIBUTION,
  MOCK_SOLVING_TIME_TREND,
  MOCK_TOPIC_MASTERY,
  MOCK_RECENT_IMPROVEMENTS,
  MOCK_AI_RECOMMENDATIONS,
} from '../data/progressMockData.js'

const DIFFICULTY_COLORS = { Easy: '#34d399', Medium: '#facc15', Hard: '#f87171' }
const CHART_GRID_COLOR = '#27272a'
const CHART_TICK = { fill: '#71717a', fontSize: 11 }
const TOOLTIP_STYLE = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }

// Phase 16: the deep-analytics counterpart to Dashboard's at-a-glance
// snapshot (that scoping split was decided back in Phase 4, precisely
// so Recharts would have a real, undiluted job to do here). Weak/strong
// topics are DERIVED from the same topic-mastery array the chart uses
// — one source of truth, not two lists that could quietly disagree.
function ProgressPage() {
  const weakTopics = MOCK_TOPIC_MASTERY.slice(0, 3)
  const strongTopics = [...MOCK_TOPIC_MASTERY].slice(-3).reverse()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">Progress</h1>
        <p className="mt-1 text-sm text-zinc-400">Demo analytics — nothing here comes from a real account yet.</p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Problems solved" value={MOCK_PROGRESS_STATS.problemsSolved} />
        <StatCard label="Accuracy" value={`${MOCK_PROGRESS_STATS.accuracy}%`} />
        <StatCard label="Total attempts" value={MOCK_PROGRESS_STATS.totalAttempts} />
        <StatCard label="Current streak" value={`${MOCK_PROGRESS_STATS.currentStreak} days`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Difficulty distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_DIFFICULTY_DISTRIBUTION}
                  dataKey="solved"
                  nameKey="difficulty"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {MOCK_DIFFICULTY_DISTRIBUTION.map((entry) => (
                    <Cell key={entry.difficulty} fill={DIFFICULTY_COLORS[entry.difficulty]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {MOCK_DIFFICULTY_DISTRIBUTION.map((entry) => (
              <div key={entry.difficulty} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DIFFICULTY_COLORS[entry.difficulty] }}
                />
                <span className="text-zinc-400">{entry.difficulty}</span>
                <span className="text-zinc-600">{entry.solved}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Solving-time trend">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_SOLVING_TIME_TREND}>
                <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={CHART_TICK} axisLine={{ stroke: CHART_GRID_COLOR }} tickLine={false} />
                <YAxis tick={CHART_TICK} axisLine={{ stroke: CHART_GRID_COLOR }} tickLine={false} width={30} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}m`, 'Avg. time']} />
                <Line type="monotone" dataKey="minutes" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Topic mastery" className="mt-4">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_TOPIC_MASTERY} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={CHART_TICK}
                axisLine={{ stroke: CHART_GRID_COLOR }}
                tickLine={false}
              />
              <YAxis type="category" dataKey="topic" tick={CHART_TICK} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}%`, 'Mastery']} />
              <Bar dataKey="mastery" fill="#fbbf24" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Strong topics">
          <ul className="flex flex-col gap-2">
            {strongTopics.map((item) => (
              <li key={item.topic} className="flex items-center justify-between text-sm">
                <span className="text-emerald-300">{item.topic}</span>
                <span className="text-zinc-500">{item.mastery}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Weak topics">
          <ul className="flex flex-col gap-2">
            {weakTopics.map((item) => (
              <li key={item.topic} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">{item.topic}</span>
                <span className="text-zinc-500">{item.mastery}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Recent improvements">
          <ul className="flex flex-col gap-2 text-sm text-zinc-400">
            {MOCK_RECENT_IMPROVEMENTS.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="AI recommendations" action={<Badge tone="ai">AI</Badge>}>
          <ul className="flex flex-col gap-2 text-sm text-zinc-400">
            {MOCK_AI_RECOMMENDATIONS.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

export default ProgressPage
