/**
 * submissionService.js
 *
 * Phase 8: mock execution.
 *
 * IMPORTANT — READ BEFORE TOUCHING THIS FILE: there is no real sandbox,
 * compiler, or test runner behind any of this. Nothing here actually
 * runs the code the user typed. It exists so the Run/Submit UX and the
 * eventual Phase 21 contract (FastAPI -> Docker sandbox -> real
 * compiler/runtime -> real results) can be built and tried out now,
 * and swapped for the real thing later without changing the calling
 * code in ProblemDetail.jsx.
 *
 * THIS IS NOT SECURE, REAL CODE EXECUTION. Never present its output as
 * proof that submitted code actually works, and never treat it as a
 * security boundary — Phase 21's Docker sandbox is what that requires.
 *
 * Mock model: code left unchanged from the starter (or empty) always
 * fails everything — never a lucky pass on nothing written. Otherwise,
 * the WHOLE submission is decided as one coin flip (ACCEPT_PROBABILITY)
 * rather than flipping a coin per test. Real code either works or it
 * doesn't — a correct solution passes every test, a buggy one usually
 * fails consistently once it hits the bug, not randomly test-by-test.
 * An earlier per-test-random version made "Accepted" nearly impossible
 * once there were 15+ hidden tests (0.8^25 ≈ 0.4%), which felt broken
 * rather than realistic — this version was corrected after testing.
 */

const RUN_TEST_COUNT = 3
const HIDDEN_TEST_COUNT_BY_DIFFICULTY = { Easy: 15, Medium: 25, Hard: 40 }
const ACCEPT_PROBABILITY = 0.6
const RUNTIME_ERROR_PROBABILITY = 0.2

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isUnattempted(code, starterCode) {
  const trimmed = (code || '').trim()
  return trimmed.length === 0 || trimmed === (starterCode || '').trim()
}

function fakeRuntimeMs() {
  return Math.floor(10 + Math.random() * 110)
}

function fakeMemoryMb() {
  return (14 + Math.random() * 20).toFixed(1)
}

/**
 * Runs the code against a small number of sample/public tests.
 * @param {{ code: string, starterCode: string, examples?: Array }} params
 */
export async function runSample({ code, starterCode, examples = [] }) {
  await delay(700)

  if (isUnattempted(code, starterCode)) {
    return {
      isMock: true,
      status: 'error',
      tests: [],
      error: "No changes detected — your function doesn't return a result yet.",
    }
  }

  const allPass = Math.random() < ACCEPT_PROBABILITY
  // If failing, pick where it starts failing rather than flipping per test —
  // once a bug shows up it tends to show up consistently, not at random.
  const failFromIndex = allPass ? RUN_TEST_COUNT : Math.floor(Math.random() * RUN_TEST_COUNT)

  const tests = Array.from({ length: RUN_TEST_COUNT }, (_, i) => {
    const passed = i < failFromIndex
    const example = examples[i]
    return {
      id: i + 1,
      passed,
      runtimeMs: fakeRuntimeMs(),
      input: example?.input ?? null,
      expectedOutput: example?.output ?? null,
      actualOutput: passed ? (example?.output ?? null) : null,
    }
  })

  return {
    isMock: true,
    status: tests.every((t) => t.passed) ? 'passed' : 'failed',
    tests,
    error: null,
  }
}

/**
 * Runs the code against the full (simulated) hidden test suite.
 * @param {{ code: string, starterCode: string, difficulty: string }} params
 */
export async function submitSolution({ code, starterCode, difficulty }) {
  await delay(1200)

  const totalTests = HIDDEN_TEST_COUNT_BY_DIFFICULTY[difficulty] || 20

  if (isUnattempted(code, starterCode)) {
    return {
      isMock: true,
      status: 'Runtime Error',
      passedTests: 0,
      totalTests,
      runtimeMs: null,
      memoryMb: null,
      failureDetail: "Your function doesn't return a result yet.",
    }
  }

  if (Math.random() < ACCEPT_PROBABILITY) {
    return {
      isMock: true,
      status: 'Accepted',
      passedTests: totalTests,
      totalTests,
      runtimeMs: fakeRuntimeMs(),
      memoryMb: fakeMemoryMb(),
      failureDetail: null,
    }
  }

  if (Math.random() < RUNTIME_ERROR_PROBABILITY) {
    const passedTests = Math.floor(Math.random() * totalTests * 0.4)
    return {
      isMock: true,
      status: 'Runtime Error',
      passedTests,
      totalTests,
      runtimeMs: null,
      memoryMb: null,
      failureDetail: 'Execution stopped unexpectedly on one of the hidden tests.',
    }
  }

  // Wrong Answer: passed most tests, failed partway through — the
  // typical shape of a nearly-correct solution.
  const passedTests = Math.max(1, Math.floor(totalTests * (0.5 + Math.random() * 0.45)))
  return {
    isMock: true,
    status: 'Wrong Answer',
    passedTests,
    totalTests,
    runtimeMs: null,
    memoryMb: null,
    failureDetail: `Failed on test ${passedTests + 1} of ${totalTests}.`,
  }
}

export async function getSubmissionHistory(/* problemId */) {
  // Real submission history arrives in Phase 9.
  return []
}
