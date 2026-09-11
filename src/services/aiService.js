/**
 * aiService.js
 *
 * Carries forward the AI code-review logic from the original Streamlit
 * prototype (see /legacy/test.py). reviewCode() below preserves the
 * PROMPT SHAPE the original used — same three questions:
 *   1. Is the code correct?
 *   2. Are there any errors?
 *   3. What could be improved?
 * It's kept as-is for the Practice page, which (like the original
 * prototype) has no problem catalog or execution context to draw on.
 *
 * Phase 10 adds reviewSubmission() below: the richer review for the
 * real problem-solving page (ProblemDetail), which DOES have a problem
 * statement, a specific language, and — critically — real Run/Submit
 * results to ground correctness in in. See buildCorrectnessAssessment()
 * for the one rule this feature's honesty rests on: never claim code
 * passed unless execution data actually says so.
 *
 * WHAT'S DIFFERENT FROM THE ORIGINAL, AND WHY:
 * - The original called Groq directly from the same process as the UI,
 *   using GROQ_API_KEY loaded from .env. That's fine in Streamlit because
 *   the whole app runs as one trusted Python process.
 * - A Vite/React app runs in the browser. Any key bundled into browser
 *   JS is public, so GROQ_API_KEY can never live here. The real call has
 *   to happen server-side — that's the FastAPI backend built in Phase 19+.
 * - Until that backend exists, this service returns a MOCK response
 *   shaped like what the real one will return, so the rest of the app
 *   can be built against a stable contract now and reconnected to the
 *   real thing later without changing any calling code.
 */

import { isPassingStatus } from '../utils/testStatus.js'
import { retrieveContext } from './ragService.js'

const USE_MOCK = true // flips to false once the FastAPI endpoint exists (Phase 19+/22)

/**
 * Builds the same review prompt the original prototype used.
 * Kept here, unused by the mock path, so the exact wording isn't lost —
 * this is what Phase 22 will send to Groq from the backend for the
 * Practice page's simpler flow.
 */
export function buildSimpleReviewPrompt({ problemStatement, code }) {
  return `You are an expert DSA code reviewer.

Problem Statement:
${problemStatement}

Student Code:
${code}

Analyze and provide:

1. Correct or not
2. Any error or not
3. Any improvements

Format the answer clearly.`
}

/**
 * Requests an AI review of a submission (Practice page — no problem
 * catalog or execution context available).
 *
 * @param {{ problemStatement: string, code: string, language?: string }} params
 * @returns {Promise<{
 *   isMock: boolean,
 *   correctness: string,
 *   errors: string,
 *   improvements: string,
 * }>}
 */
export async function reviewCode({ problemStatement, code, language = 'python' }) {
  if (!problemStatement || !code) {
    throw new Error('Both problem statement and code are required.')
  }

  if (USE_MOCK) {
    return mockReviewCode({ problemStatement, code, language })
  }

  // --- Real path (Phase 19+/22) ---
  // const response = await fetch('/api/ai/review', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ problemStatement, code, language }),
  // })
  // if (!response.ok) throw new Error('AI review request failed.')
  // return response.json()
  throw new Error('Real AI review backend is not implemented yet.')
}

// Simulates network latency and returns a realistic, clearly-labeled mock.
async function mockReviewCode({ code }) {
  await new Promise((resolve) => setTimeout(resolve, 900))

  return {
    isMock: true,
    correctness:
      'This is a mock response — Phase 1 has no backend yet. Once the FastAPI ' +
      'service and Groq call are wired up (Phase 19+), a real correctness ' +
      'assessment will appear here.',
    errors:
      code.trim().length === 0
        ? 'No code was submitted.'
        : 'Mock analysis: no execution has actually run against this code yet. ' +
          'Real error detection depends on the test-execution engine (Phase 8/21).',
    improvements:
      'Mock suggestion: keep variable names descriptive and check edge cases ' +
      'like empty input. Real, code-specific suggestions arrive once Groq is ' +
      'connected in Phase 22.',
  }
}

/**
 * Builds the real Phase 22 prompt for the problem-page review. testResults
 * is whatever Run or Submit last returned (see ProblemDetail.jsx's
 * normalizeTestResultsForReview) — the prompt tells the model to treat
 * it as ground truth for correctness rather than guessing independently.
 */
export function buildReviewPrompt({ problemStatement, code, language, testResults }) {
  const testSummary = testResults
    ? `Test results (source: ${testResults.source}): ${testResults.status}, ${testResults.passedTests}/${testResults.totalTests} tests passed. Treat this as ground truth — do not contradict it.`
    : 'Test results: none yet. The user has not run or submitted this code. Do not claim or imply the code is correct or incorrect based on execution — say so explicitly.'

  return `You are an expert DSA code reviewer helping a student improve, not just judging a submission.

Problem Statement:
${problemStatement}

Language: ${language}

Student Code:
${code}

${testSummary}

Provide, as clearly labeled sections:
1. Overall Assessment
2. Bug Analysis
3. Time Complexity
4. Space Complexity
5. Code Quality
6. Suggested Improvement
7. Learning Tip`
}

/**
 * Requests the full Phase 10 review for the real problem-solving page.
 *
 * @param {{
 *   problemStatement: string,
 *   code: string,
 *   language: string,
 *   testResults: { source: 'run'|'submit', status: string, passedTests: number, totalTests: number } | null,
 * }} params
 */
export async function reviewSubmission({ problemStatement, code, language, testResults }) {
  if (!code || code.trim().length === 0) {
    throw new Error('Write some code before requesting a review.')
  }

  if (USE_MOCK) {
    return mockReviewSubmission({ problemStatement, code, language, testResults })
  }

  // --- Real path (Phase 19+/22) ---
  // const response = await fetch('/api/ai/review-submission', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ problemStatement, code, language, testResults }),
  // })
  // if (!response.ok) throw new Error('AI review request failed.')
  // return response.json()
  throw new Error('Real AI review backend is not implemented yet.')
}

async function mockReviewSubmission({ language, testResults }) {
  await new Promise((resolve) => setTimeout(resolve, 1100))

  return {
    isMock: true,
    overallAssessment: buildCorrectnessAssessment(testResults),
    bugAnalysis:
      'This is a mock response. A real review (Phase 22) would trace through your ' +
      'logic against the specific way it fails. For now: if a submission didn\'t pass, ' +
      'off-by-one errors and unhandled edge cases (empty input, single element) are the ' +
      'most common culprits worth checking first.',
    timeComplexity:
      'This is a mock response — a generic placeholder, not derived from reading your ' +
      `actual ${language} code. Once Groq is connected (Phase 22), this will state the ` +
      'real Big-O based on your implementation.',
    spaceComplexity:
      'This is a mock response — same caveat as Time Complexity above: not derived from ' +
      'your actual code yet.',
    codeQuality:
      'This is a mock response. A real review would comment on naming, structure, and ' +
      'readability specific to what you wrote. For now: descriptive variable names and ' +
      'avoiding deeply nested conditionals are good defaults.',
    suggestedImprovement:
      'This is a mock response. Once connected to Groq, this section will suggest a ' +
      'concrete, code-specific optimization rather than generic advice.',
    learningTip:
      'This is a mock response. A real tip would be tailored to the specific pattern this ' +
      'problem exercises and how your code approached it.',
  }
}

/**
 * THE RULE THIS ENTIRE FEATURE'S HONESTY DEPENDS ON: never claim code
 * passed tests unless testResults actually says so. Kept as its own
 * small function so it's easy to find and audit later, including once
 * this is replaced by a real prompt instruction in Phase 22 (where the
 * same rule has to be enforced by prompting the model correctly, not by
 * code — worth remembering that it gets harder to guarantee, not easier).
 */
function buildCorrectnessAssessment(testResults) {
  if (!testResults) {
    return (
      'This is a mock response. Correctness has not been verified — you have not run or ' +
      "submitted this code yet, so this review can't confirm or deny that it works. Run or " +
      'submit first for an objective result.'
    )
  }

  const isPassing = isPassingStatus(testResults.status)

  if (isPassing) {
    return (
      `This is a mock response. Based on your last ${testResults.source}, your code passed ` +
      `${testResults.passedTests}/${testResults.totalTests} tests. Once Groq is connected ` +
      '(Phase 22), this section will explain *why* it works, not just confirm that it does.'
    )
  }

  return (
    `This is a mock response. Based on your last ${testResults.source} (${testResults.status}, ` +
    `${testResults.passedTests}/${testResults.totalTests} tests passed), your code is not fully ` +
    'correct yet. A real review would explain what\'s likely going wrong once Groq is connected ' +
    '(Phase 22).'
  )
}

/**
 * Phase 11: AI Hint system. Graduated: hint 1 is a small conceptual
 * clue, hint 2 a stronger direction, hint 3 near-solution guidance.
 *
 * A full worked solution is deliberately NOT offered anywhere in this
 * mock. Generating one on the fly here would mean fabricating
 * algorithm code with no verification that it's actually correct —
 * exactly the kind of confidently-wrong content a learning tool
 * shouldn't hand someone. That capability waits for Phase 22, where a
 * real model (and ideally a real correctness check against test cases)
 * backs it up.
 *
 * @param {{ problem: object, hintLevel: 1 | 2 | 3 }} params
 */
export async function getHint({ problem, hintLevel }) {
  await new Promise((resolve) => setTimeout(resolve, 700))

  return {
    isMock: true,
    level: hintLevel,
    content: mockHintContent(problem, hintLevel),
  }
}

function mockHintContent(problem, level) {
  const authored = problem.hints || []

  if (level === 1) {
    return authored[0]
      ? `This is a mock response. ${authored[0]}`
      : `This is a mock response. Start with the simplest brute-force approach for this ` +
          `${problem.topic} problem, even if it's not efficient — getting something working ` +
          'first makes the real bottleneck easier to spot.'
  }

  if (level === 2) {
    return authored[1]
      ? `This is a mock response. ${authored[1]}`
      : `This is a mock response. Think about which ${problem.topic} technique usually beats ` +
          'a brute-force approach for problems shaped like this one — a real hint (Phase 22) ' +
          'would name the specific technique your code is missing.'
  }

  // level 3 — near-solution guidance, still not the solution itself.
  return (
    'This is a mock response. A real near-solution hint (Phase 22) would walk through the ' +
    "key step right before the final answer, without handing you the code. A full worked " +
    "solution isn't offered in this demo — once Groq is connected, you'll be able to ask for " +
    'one explicitly, separately from hints.'
  )
}

/**
 * Phase 11: AI Debugger. Explains a failure — it does not rewrite the
 * solution. The response shape enforces this structurally: there is no
 * "correctedCode" field here, on purpose, so a future real
 * implementation can't accidentally slide into handing over a fix
 * instead of an explanation.
 *
 * @param {{ code: string, language: string, testResults: object | null }} params
 */
export async function debugError({ code, language, testResults }) {
  await new Promise((resolve) => setTimeout(resolve, 900))

  if (!code || code.trim().length === 0) {
    throw new Error('Write some code before requesting a debug explanation.')
  }

  const context = testResults
    ? `${testResults.status} (${testResults.passedTests}/${testResults.totalTests} tests passed)`
    : 'an unspecified failure'

  return {
    isMock: true,
    likelyCause:
      `This is a mock response. Based on your last result (${context}), a real debugger ` +
      '(Phase 22) would trace through your logic against the specific failing case. Common ' +
      `culprits for ${language} solutions at this stage: an unhandled edge case (empty input, ` +
      'a single element, duplicate values) or an off-by-one at a loop boundary.',
    debuggingDirection:
      'This is a mock response. Try adding a print/log statement right before your return ' +
      'value and re-running with the smallest input that could break it. A real debugger ' +
      "would point at your specific line — and even then, it explains the bug rather than " +
      'rewriting your solution for you.',
  }
}

/**
 * Phase 12: AI Mentor chat. Conversational — takes the FULL message
 * history, not just the latest message, which is the "conversation
 * history architecture" the spec asks for and what Phase 22's real
 * multi-turn Groq call will need.
 *
 * Phase 13: now actually calls the RAG retriever (ragService.js) before
 * replying, and folds any retrieved knowledge into the response — this
 * is the "Prompt" step in User Question -> Retriever -> Relevant
 * Knowledge -> Prompt -> LLM -> Answer, feeding into the (still mocked)
 * "LLM -> Answer" step below. userMemoryUsed stays empty until Phase 14.
 *
 * @param {{ messages: Array<{ role: 'user'|'assistant', content: string }> }} params
 */
export async function chatWithMentor({ messages }) {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const questionText = lastUserMessage?.content || ''

  const { chunks } = await retrieveContext(questionText)
  const baseReply = mockMentorReply(questionText)
  const content =
    chunks.length > 0
      ? `${baseReply}\n\nRelated knowledge retrieved for this question — "${chunks[0].title}": ${chunks[0].content}`
      : baseReply

  return {
    isMock: true,
    reply: {
      role: 'assistant',
      content,
    },
    ragContext: chunks,
    userMemoryUsed: [],
  }
}

// Simple keyword matching, not real understanding — but it means each
// of the spec's example query types gets a genuinely different, more
// useful reply than one generic canned response for everything.
function mockMentorReply(userText) {
  const text = userText.toLowerCase()

  if (text.includes('hint')) {
    return (
      "This is a mock response. For a hint on a specific problem, open that problem's page " +
      'and use the AI Hints panel — it gives graduated hints without spoiling the solution. ' +
      "I don't have access to a specific problem from this chat yet (Phase 13/14 add shared " +
      'context), so I can only speak in general terms here.'
    )
  }
  if (text.includes('wrong') || text.includes('why')) {
    return (
      "This is a mock response. I can't see your specific code from this chat yet — that needs " +
      "Phase 14's shared context/memory. Paste the relevant part here, or open the AI Review on " +
      "that problem's page for an assessment grounded in your actual last result."
    )
  }
  if (text.includes('optimal')) {
    return (
      'This is a mock response. A real answer (Phase 22) would name the specific optimal ' +
      'technique for whatever problem you have in mind. In general: look for approaches that ' +
      'avoid repeated work — hashing, two pointers, and sorting are common ways to cut a ' +
      'brute-force approach down.'
    )
  }
  if (text.includes('complexity') || text.includes('big o')) {
    return (
      "This is a mock response. A real answer (Phase 22) would analyze the specific algorithm " +
      "you're asking about. In general: count how the dominant operation scales with input size — " +
      'nested loops over the same input usually mean O(n^2), a single pass means O(n), and ' +
      'repeatedly halving the input means O(log n).'
    )
  }
  if (text.includes('study') || text.includes('next')) {
    return (
      "This is a mock response. Once Phase 14's user memory is connected, this would point at " +
      'your actual weak topics from the Dashboard. For now, a reasonable general order: Arrays/' +
      'Strings, then Hashing, then Trees/Graphs, then Dynamic Programming.'
    )
  }
  if (text.includes('improve')) {
    return (
      'This is a mock response. General advice: solve a mix of difficulties rather than only ' +
      'Easy problems, read the AI Review after each submission instead of skipping it, and ' +
      "revisit topics you've been avoiding."
    )
  }
  if (text.includes('compare')) {
    return (
      "This is a mock response. Tell me the two approaches and I'll compare them once a real " +
      'model is connected (Phase 22). For now, a generic frame: compare their time complexity, ' +
      'space complexity, and how easy each is to implement correctly under time pressure.'
    )
  }
  if (text.includes('error')) {
    return (
      "This is a mock response. For a specific error, the AI Debugger on that problem's page " +
      "(Phase 11) can look at your actual last result. In general: read the error message's " +
      'first line carefully — it usually names the exact operation that failed.'
    )
  }
  if (text.includes('explain')) {
    return (
      "This is a mock response. Tell me which concept, and once Groq + RAG are connected " +
      '(Phase 22/13) I\'ll pull in real reference material. For now, most DSA concepts break ' +
      'down into: what problem it solves, the core idea, and its time/space tradeoff.'
    )
  }

  return (
    "This is a mock response — the AI Mentor isn't connected to a real model yet (Phase 22). " +
    'Try asking about a hint, an error, what to study next, or comparing two approaches — I ' +
    'have a slightly more specific canned reply for each of those in this demo.'
  )
}
