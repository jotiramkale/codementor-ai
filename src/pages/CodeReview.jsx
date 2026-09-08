import { useState } from 'react'
import { reviewCode } from '../services/aiService.js'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'

// Same fields, same validation, same basic flow as the original test.py —
// restyled in Phase 2 to match the rest of the shell instead of standing
// out with the old plain CSS.
function CodeReview() {
  const [problemStatement, setProblemStatement] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [review, setReview] = useState(null)
  const [warning, setWarning] = useState('')
  const [error, setError] = useState('')

  async function handleReview() {
    setWarning('')
    setError('')
    setReview(null)

    if (!problemStatement || !studentCode) {
      setWarning('Please enter both problem statement and code.')
      return
    }

    setIsLoading(true)
    try {
      const result = await reviewCode({ problemStatement, code: studentCode })
      setReview(result)
    } catch (err) {
      setError(err.message || 'Something went wrong while reviewing the code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">CodeMentor AI</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a DSA problem and your solution — AI will review the code.
        </p>
      </header>

      {warning && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          {warning}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="problem-statement" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Problem Statement
        </label>
        <textarea
          id="problem-statement"
          rows={6}
          placeholder="Enter DSA problem statement here..."
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-400"
        />
      </div>

      <div className="mb-5">
        <label htmlFor="student-code" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Your Code
        </label>
        <textarea
          id="student-code"
          rows={10}
          placeholder="Paste your code here..."
          value={studentCode}
          onChange={(e) => setStudentCode(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-400"
        />
      </div>

      <Button onClick={handleReview} disabled={isLoading}>
        {isLoading ? 'Analyzing…' : 'Review Code'}
      </Button>

      {review && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          {review.isMock && (
            <Badge tone="ai" className="mb-3">
              MOCK RESPONSE
            </Badge>
          )}

          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">Correctness</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{review.correctness}</p>
          </div>

          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">Errors</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{review.errors}</p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">Improvements</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{review.improvements}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeReview
