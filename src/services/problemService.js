import { apiRequest } from './apiClient.js'

export function fromApiProblem(problem) {
  return {
    ...problem,
    estimatedTime: problem.estimated_time || '',
    expectedInput: problem.expected_input || '',
    expectedOutput: problem.expected_output || '',
    starterCode: problem.starter_code || {},
    aiRecommended: Boolean(problem.ai_recommended),
    bestTime: problem.best_time_seconds == null ? null : `${Math.floor(problem.best_time_seconds / 60)}m ${problem.best_time_seconds % 60}s`,
    testCases: problem.test_cases?.map((test) => ({ ...test, expectedOutput: test.expected_output })) || [],
  }
}

export function toApiProblem(problem) {
  return {
    title: problem.title,
    difficulty: problem.difficulty,
    topic: problem.topic,
    estimated_time: problem.estimatedTime,
    description: problem.description,
    expected_input: problem.expectedInput,
    expected_output: problem.expectedOutput,
    examples: problem.examples || [],
    constraints: problem.constraints || [],
    hints: problem.hints || [],
    starter_code: problem.starterCode || {},
    test_cases: (problem.testCases || []).map((test) => ({
      input: test.input,
      expected_output: test.expectedOutput,
      hidden: Boolean(test.hidden),
    })),
  }
}

export async function listProblems() {
  return (await apiRequest('/api/problems')).map(fromApiProblem)
}

export async function getProblemById(id) {
  return fromApiProblem(await apiRequest(`/api/problems/${encodeURIComponent(id)}`))
}

export async function listAdminProblems() {
  return listProblems()
}

export async function getAdminProblemById(id) {
  const [problem, testCases] = await Promise.all([
    apiRequest(`/api/problems/${encodeURIComponent(id)}`),
    apiRequest(`/api/problems/${encodeURIComponent(id)}/test-cases`),
  ])
  return fromApiProblem({ ...problem, test_cases: testCases })
}

export async function createProblem(problem) {
  return fromApiProblem(await apiRequest('/api/problems', { method: 'POST', body: toApiProblem(problem) }))
}

export async function updateProblem(id, problem) {
  return fromApiProblem(await apiRequest(`/api/problems/${encodeURIComponent(id)}`, { method: 'PUT', body: toApiProblem(problem) }))
}

export async function deleteProblem(id) {
  return apiRequest(`/api/problems/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
