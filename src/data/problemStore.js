/**
 * problemStore.js
 *
 * Phase 18: turns the Phase 5 static catalog into a genuinely mutable
 * in-memory store, so Admin's create/edit/delete actually changes what
 * Problems, ProblemDetail, and Interview Mode show — not a disconnected
 * admin form that doesn't affect anything. Still entirely client-side
 * and resets on a page refresh; Phase 19-20 replaces this with a real
 * PostgreSQL-backed API using the same shape.
 *
 * Read via getProblems()/getProblemById() at render time (inside a
 * component body or effect, not captured once at module load) so each
 * render sees current data. There's no pub/sub here — a page that's
 * already mounted won't auto-refresh the instant another page changes
 * something; navigating to it (a fresh render) shows the current
 * state. That's an honest, scoped limitation for a client-only mock,
 * not a bug being hidden.
 */

import { MOCK_PROBLEMS as INITIAL_PROBLEMS } from './problemsMockData.js'

let problems = [...INITIAL_PROBLEMS]
let nextId = Math.max(...problems.map((p) => p.id)) + 1

export function getProblems() {
  return problems
}

export function getProblemById(id) {
  return problems.find((p) => String(p.id) === String(id))
}

export function createProblem(data) {
  const problem = {
    attempts: 0,
    bestTime: null,
    solved: false,
    aiRecommended: false,
    testCases: [],
    ...data,
    id: nextId,
  }
  nextId += 1
  problems = [...problems, problem]
  return problem
}

export function updateProblem(id, updates) {
  problems = problems.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p))
  return getProblemById(id)
}

export function deleteProblem(id) {
  problems = problems.filter((p) => String(p.id) !== String(id))
}
