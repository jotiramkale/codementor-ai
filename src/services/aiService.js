import { apiRequest } from './apiClient.js'

/** Stateless review that preserves the original prototype's three sections. */
export async function reviewCode({ problemStatement, code, language = 'python' }) {
  if (!problemStatement?.trim() || !code?.trim()) {
    throw new Error('Both problem statement and code are required.')
  }
  const result = await apiRequest('/api/ai/review-code', {
    method: 'POST',
    body: { problem_statement: problemStatement, code, language },
  })
  return { isMock: false, correctness: result.correctness, errors: result.errors, improvements: result.improvements }
}

/** Full problem review; execution claims are verified against the user's saved submissions server-side. */
export async function reviewSubmission({ problemId, code, language }) {
  if (!code?.trim()) throw new Error('Write some code before requesting a review.')
  if (!problemId) throw new Error('A saved problem is required for an authenticated AI review.')
  const result = await apiRequest('/api/ai/review', {
    method: 'POST', body: { problem_id: Number(problemId), code, language },
  })
  return {
    isMock: false,
    overallAssessment: result.overall_assessment,
    bugAnalysis: result.bug_analysis,
    timeComplexity: result.time_complexity,
    spaceComplexity: result.space_complexity,
    codeQuality: result.code_quality,
    suggestedImprovement: result.suggested_improvement,
    learningTip: result.learning_tip,
  }
}

export async function getHint({ problem, hintLevel }) {
  if (!problem?.id) throw new Error('A saved problem is required to request a hint.')
  const result = await apiRequest('/api/ai/hint', {
    method: 'POST', body: { problem_id: Number(problem.id), hint_level: hintLevel },
  })
  return { isMock: false, level: result.level, content: result.content }
}

export async function debugError({ problemId, code, language }) {
  if (!code?.trim()) throw new Error('Write some code before requesting a debug explanation.')
  if (!problemId) throw new Error('A saved problem is required to request debugging help.')
  const result = await apiRequest('/api/ai/debug', {
    method: 'POST', body: { problem_id: Number(problemId), code, language },
  })
  return { isMock: false, likelyCause: result.likely_cause, debuggingDirection: result.debugging_direction }
}

export async function chatWithMentor({ messages }) {
  const result = await apiRequest('/api/ai/chat', {
    method: 'POST',
    body: { messages: messages.map(({ role, content }) => ({ role, content })) },
  })
  return {
    isMock: false,
    reply: result.reply,
    ragContext: result.rag_context || [],
    userMemoryUsed: result.user_memory_used || [],
    trace: result.trace || null,
  }
}

export async function generateProblemDraft({ topic = 'Arrays', difficulty = 'Medium' } = {}) {
  const result = await apiRequest('/api/ai/problem-draft', {
    method: 'POST', body: { topic, difficulty },
  })
  return {
    isMock: false,
    draft: {
      ...result,
      estimatedTime: result.estimated_time,
      expectedInput: result.expected_input,
      expectedOutput: result.expected_output,
      starterCode: result.starter_code,
      testCases: [],
    },
  }
}
