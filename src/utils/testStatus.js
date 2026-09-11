// Shared notion of "this result counts as passing" — used by both the
// AI Review's honesty check (never claim success unless this is true)
// and the AI Debugger's visibility (only offer debugging on a failure).
// Kept in one place so the two features can never disagree about what
// counts as a pass.
export function isPassingStatus(status) {
  return status === 'Accepted' || status === 'passed' || status === 'Passed sample tests'
}
