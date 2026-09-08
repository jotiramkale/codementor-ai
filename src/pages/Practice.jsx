import CodeReview from './CodeReview.jsx'

// The full Monaco-editor problem-solving experience (browse a problem,
// run/submit against test cases) arrives in Phases 6-8. Until then,
// Practice hosts the original prototype's flow, relocated here rather
// than left floating outside the new navigation.
function Practice() {
  return (
    <div>
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
        This is the Phase 1 prototype flow, relocated here. The full problem browser and code
        editor (Phases 5–8) will replace this view.
      </div>
      <CodeReview />
    </div>
  )
}

export default Practice
