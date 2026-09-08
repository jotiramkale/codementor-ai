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

  const isPassing = testResults.status === 'Accepted' || testResults.status === 'passed'

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
