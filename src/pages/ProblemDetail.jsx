import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import Panel from '../components/ui/Panel.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import ReviewSection from '../components/ui/ReviewSection.jsx'
import CodeEditor from '../components/CodeEditor.jsx'
import { toneForDifficulty } from '../utils/difficulty.js'
import { formatDuration, formatShortDateTime } from '../utils/time.js'
import { communityStatsForProblem, estimatePercentile } from '../utils/communityStats.js'
import { MOCK_PROBLEMS, DEFAULT_STARTER_CODE } from '../data/problemsMockData.js'
import { labelForLanguage } from '../data/languages.js'
import { runSample, submitSolution } from '../services/submissionService.js'
import { reviewSubmission } from '../services/aiService.js'

// Phase 10: adds the full AI Review panel (Overall Assessment, Bug
// Analysis, Time/Space Complexity, Code Quality, Suggested Improvement,
// Learning Tip) on top of Phase 9's timer/history. Still entirely
// mocked — see services/aiService.js's reviewSubmission() for the rule
// this feature's honesty rests on: never claim code passed tests unless
// a real Run/Submit result says so.
function ProblemDetail() {
  const { id } = useParams()
  const problem = MOCK_PROBLEMS.find((p) => String(p.id) === id)
  const [showHints, setShowHints] = useState(false)

  const starterCode = problem?.starterCode || DEFAULT_STARTER_CODE
  const [language, setLanguage] = useState('python')
  const [theme, setTheme] = useState('vs-dark')
  const [codeByLanguage, setCodeByLanguage] = useState(() => ({ ...starterCode }))

  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [submissionHistory, setSubmissionHistory] = useState([])

  const [isReviewing, setIsReviewing] = useState(false)
  const [aiReview, setAiReview] = useState(null)
  const [aiReviewError, setAiReviewError] = useState('')

  // started_at for this problem-solving session. Resets if you navigate
  // away and back (a fresh page load), since nothing persists it yet.
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!problem) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
        <p className="text-sm text-zinc-400">Problem not found in the demo catalog.</p>
        <Link to="/problems" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">
          Back to Problems
        </Link>
      </div>
    )
  }

  const hasFullDetail = Boolean(problem.description)
  const currentCode = codeByLanguage[language]
  const elapsedSeconds = Math.floor((now - startedAt) / 1000)
  const communityStats = communityStatsForProblem(problem)

  function handleCodeChange(value) {
    setCodeByLanguage((prev) => ({ ...prev, [language]: value }))
  }

  function handleReset() {
    setCodeByLanguage((prev) => ({ ...prev, [language]: starterCode[language] }))
  }

  async function handleRun() {
    setIsRunning(true)
    setSubmitResult(null)
    try {
      const result = await runSample({
        code: currentCode,
        starterCode: starterCode[language],
        examples: problem.examples,
      })
      setRunResult(result)
    } finally {
      setIsRunning(false)
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setRunResult(null)
    const submittedAt = Date.now()
    const solvingSeconds = Math.floor((submittedAt - startedAt) / 1000)
    try {
      const result = await submitSolution({
        code: currentCode,
        starterCode: starterCode[language],
        difficulty: problem.difficulty,
      })
      const attemptNumber = submissionHistory.length + 1
      setSubmitResult({ ...result, solvingSeconds })
      setSubmissionHistory((prev) => [
        {
          id: attemptNumber,
          attemptNumber,
          status: result.status,
          language,
          runtimeMs: result.runtimeMs,
          memoryMb: result.memoryMb,
          solvingSeconds,
          date: new Date(submittedAt),
        },
        ...prev,
      ])
    } finally {
      setIsSubmitting(false)
    }
  }

  // The AI review's correctness claim is only ever allowed to speak
  // from real execution data — this is the single place that data comes
  // from, so the honesty rule in aiService.js has exactly one source to
  // trust. Submit (hidden tests) is preferred as the more authoritative
  // signal; Run (sample tests) is used only if nothing has been
  // submitted yet; neither existing means the review must say so.
  function normalizeTestResultsForReview() {
    if (submitResult) {
      return {
        source: 'submit',
        status: submitResult.status,
        passedTests: submitResult.passedTests,
        totalTests: submitResult.totalTests,
      }
    }
    if (runResult && runResult.status !== 'error') {
      return {
        source: 'run',
        status: runResult.status === 'passed' ? 'Passed sample tests' : 'Failed sample tests',
        passedTests: runResult.tests.filter((t) => t.passed).length,
        totalTests: runResult.tests.length,
      }
    }
    return null
  }

  async function handleAiReview() {
    setIsReviewing(true)
    setAiReviewError('')
    try {
      const result = await reviewSubmission({
        problemStatement: problem.description || `${problem.title} (${problem.topic}, ${problem.difficulty})`,
        code: currentCode,
        language,
        testResults: normalizeTestResultsForReview(),
      })
      setAiReview(result)
    } catch (err) {
      setAiReviewError(err.message || 'Something went wrong while requesting the review.')
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <div>
      <Link to="/problems" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <FiArrowLeft className="h-4 w-4" /> Back to Problems
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-zinc-50">{problem.title}</h1>
          <Badge tone={toneForDifficulty(problem.difficulty)}>{problem.difficulty}</Badge>
          {problem.aiRecommended && <Badge tone="ai">AI pick</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-zinc-500">
          <span>{problem.topic}</span>
          <span>Est. {problem.estimatedTime}</span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Panel title="Problem">
            {hasFullDetail ? (
              <div className="flex flex-col gap-4 text-sm text-zinc-300">
                <p>{problem.description}</p>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500">Expected input</p>
                  <p>{problem.expectedInput}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500">Expected output</p>
                  <p>{problem.expectedOutput}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500">Examples</p>
                  <div className="flex flex-col gap-2">
                    {problem.examples.map((example, index) => (
                      <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 font-mono text-xs">
                        <p className="text-zinc-400">
                          Input: <span className="text-zinc-200">{example.input}</span>
                        </p>
                        <p className="text-zinc-400">
                          Output: <span className="text-zinc-200">{example.output}</span>
                        </p>
                        {example.explanation && <p className="mt-1 text-zinc-500">{example.explanation}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500">Constraints</p>
                  <ul className="list-inside list-disc text-zinc-400">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="font-mono text-xs">
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Full problem statement not yet written for this demo problem. Try "Two Sum", "Valid
                Parentheses", "Reverse Linked List", "Binary Search", "Climbing Stairs", or "Merge Intervals"
                for a complete example.
              </p>
            )}
          </Panel>

          {hasFullDetail && (
            <Panel title="Hints">
              {showHints ? (
                <ul className="flex flex-col gap-2">
                  {problem.hints.map((hint, index) => (
                    <li key={index} className="text-sm text-zinc-400">
                      <span className="text-zinc-500">{index + 1}.</span> {hint}
                    </li>
                  ))}
                </ul>
              ) : (
                <button type="button" onClick={() => setShowHints(true)} className="text-sm text-indigo-400 hover:text-indigo-300">
                  Reveal hints
                </button>
              )}
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel
            title="Your code"
            action={
              <span className="font-mono text-sm text-zinc-400" title="Time since you opened this problem">
                {formatDuration(elapsedSeconds)}
              </span>
            }
          >
            <CodeEditor
              language={language}
              onLanguageChange={setLanguage}
              theme={theme}
              onThemeChange={setTheme}
              code={currentCode}
              onCodeChange={handleCodeChange}
              onReset={handleReset}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={handleRun} disabled={isRunning || isSubmitting}>
                {isRunning ? 'Running…' : 'Run'}
              </Button>
              <Button onClick={handleSubmit} disabled={isRunning || isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Simulated results — no real compiler or sandbox runs this code yet (Phase 21).
            </p>
          </Panel>

          {runResult && (
            <Panel title="Run result">
              {runResult.status === 'error' ? (
                <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {runResult.error}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-zinc-400">
                    {runResult.tests.filter((t) => t.passed).length} of {runResult.tests.length} sample tests
                    passed
                  </p>
                  {runResult.tests.map((test) => (
                    <div key={test.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300">Test {test.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{test.runtimeMs} ms</span>
                          <Badge tone={test.passed ? 'success' : 'danger'}>{test.passed ? 'Passed' : 'Failed'}</Badge>
                        </div>
                      </div>
                      {test.input && (
                        <div className="mt-2 font-mono text-zinc-500">
                          <p>
                            Input: <span className="text-zinc-300">{test.input}</span>
                          </p>
                          <p>
                            Expected: <span className="text-zinc-300">{test.expectedOutput}</span>
                          </p>
                          {!test.passed && <p className="text-red-300">Got a different result</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {submitResult && (
            <Panel
              title="Submission result"
              action={
                <Badge tone={submitResult.status === 'Accepted' ? 'success' : 'danger'}>{submitResult.status}</Badge>
              }
            >
              <div className="flex flex-col gap-3 text-sm">
                <p className="text-zinc-400">
                  {submitResult.passedTests} / {submitResult.totalTests} hidden tests passed
                </p>

                {submitResult.status === 'Accepted' ? (
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-zinc-500">Runtime</p>
                      <p className="text-zinc-200">{submitResult.runtimeMs} ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Memory</p>
                      <p className="text-zinc-200">{submitResult.memoryMb} MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                    {submitResult.failureDetail}
                  </div>
                )}

                {submitResult.status === 'Accepted' && (
                  <div className="border-t border-zinc-800 pt-3">
                    <p className="mb-2 text-xs font-medium text-zinc-500">
                      How you compare (demo data — no real community submissions exist yet)
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-zinc-500">Your time</p>
                        <p className="text-zinc-200">{formatDuration(submitResult.solvingSeconds)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Community median</p>
                        <p className="font-semibold text-zinc-100">
                          {formatDuration(communityStats.medianSeconds)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Community average</p>
                        <p className="text-zinc-400">{formatDuration(communityStats.averageSeconds)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Percentile</p>
                        <p className="text-zinc-200">
                          Faster than{' '}
                          {estimatePercentile(submitResult.solvingSeconds, communityStats.medianSeconds)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <Panel title="AI Review" className="mt-4" action={<Badge tone="ai">AI</Badge>}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button variant="ai" onClick={handleAiReview} disabled={isReviewing}>
            {isReviewing ? 'Reviewing…' : 'Request AI review'}
          </Button>
          <span className="text-xs text-zinc-500">
            {submitResult
              ? "Using your latest submission's result as ground truth for correctness."
              : runResult && runResult.status !== 'error'
                ? "Using your latest run's sample results as ground truth for correctness."
                : 'No run or submission yet — correctness will be marked as unverified rather than guessed.'}
          </span>
        </div>

        {aiReviewError && (
          <div className="mb-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {aiReviewError}
          </div>
        )}

        {aiReview && (
          <div className="flex flex-col gap-4">
            {aiReview.isMock && <Badge tone="neutral">MOCK RESPONSE</Badge>}
            <ReviewSection title="Overall Assessment" content={aiReview.overallAssessment} />
            <ReviewSection title="Bug Analysis" content={aiReview.bugAnalysis} />
            <div className="grid gap-4 sm:grid-cols-2">
              <ReviewSection title="Time Complexity" content={aiReview.timeComplexity} />
              <ReviewSection title="Space Complexity" content={aiReview.spaceComplexity} />
            </div>
            <ReviewSection title="Code Quality" content={aiReview.codeQuality} />
            <ReviewSection title="Suggested Improvement" content={aiReview.suggestedImprovement} />
            <ReviewSection title="Learning Tip" content={aiReview.learningTip} />
          </div>
        )}
      </Panel>

      {submissionHistory.length > 0 && (
        <Panel title="Submission history" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Attempt</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Language</th>
                  <th className="pb-2 pr-4 font-medium">Runtime</th>
                  <th className="pb-2 pr-4 font-medium">Memory</th>
                  <th className="pb-2 pr-4 font-medium">Solving time</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {submissionHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-4 text-zinc-300">{entry.attemptNumber}</td>
                    <td className="py-2 pr-4">
                      <Badge tone={entry.status === 'Accepted' ? 'success' : 'danger'}>{entry.status}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-zinc-400">{labelForLanguage(entry.language)}</td>
                    <td className="py-2 pr-4 text-zinc-400">{entry.runtimeMs ? `${entry.runtimeMs} ms` : '—'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{entry.memoryMb ? `${entry.memoryMb} MB` : '—'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{formatDuration(entry.solvingSeconds)}</td>
                    <td className="py-2 text-zinc-500">{formatShortDateTime(entry.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Kept only for this visit to the page — real persisted history arrives with the backend
            (Phase 19+/20).
          </p>
        </Panel>
      )}
    </div>
  )
}

export default ProblemDetail
