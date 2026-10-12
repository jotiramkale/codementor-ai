import { apiRequest } from './apiClient.js'

function fromRunResult(result) {
  return {
    isMock: false,
    status: result.status,
    error: result.error,
    tests: (result.tests || []).map((test) => ({
      id: test.id,
      passed: test.passed,
      runtimeMs: test.runtime_ms,
      input: test.input,
      expectedOutput: test.expected_output,
      actualOutput: test.actual_output,
    })),
  }
}

function fromSubmissionResult(result) {
  return {
    isMock: false,
    id: result.id,
    status: result.status,
    passedTests: result.passed_tests,
    totalTests: result.total_tests,
    runtimeMs: result.runtime_ms,
    memoryMb: result.memory_mb,
    failureDetail: result.failure_detail,
  }
}

export async function runSample({ problemId, code, language }) {
  return fromRunResult(await apiRequest('/api/submissions/run', {
    method: 'POST',
    body: { problem_id: Number(problemId), code, language },
  }))
}

export async function submitSolution({ problemId, code, language, solvingTime }) {
  return fromSubmissionResult(await apiRequest('/api/submissions/submit', {
    method: 'POST',
    body: { problem_id: Number(problemId), code, language, solving_time: solvingTime },
  }))
}

export async function getSubmissionHistory(problemId) {
  const query = problemId == null ? '' : `?problem_id=${encodeURIComponent(problemId)}`
  const rows = await apiRequest(`/api/submissions/history${query}`)
  return rows.map((row) => ({
    id: row.id,
    problemId: row.problem_id,
    attemptNumber: row.attempt_number,
    status: row.status,
    language: row.language,
    runtimeMs: row.runtime_ms,
    memoryMb: row.memory_mb,
    solvingSeconds: row.solving_time,
    date: new Date(row.created_at),
  }))
}
