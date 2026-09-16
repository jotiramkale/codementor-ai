/**
 * interviewService.js
 *
 * Phase 17: Interview Mode. Reuses existing mock building blocks rather
 * than inventing a parallel judging system — an interview problem is
 * still just a problem, so its code still runs through the same (mock)
 * submissionService used everywhere else, and its one controlled hint
 * reuses aiService's getHint().
 *
 * On "company mode": there's no honest way to offer real company-
 * specific question banks here — that would mean fabricating a claim
 * about how a specific real company actually interviews, with no real
 * source behind it. This implements the "topic mode" half of that
 * spec line for real (a genuine topic filter over the catalog) and
 * treats "no topic selected" as the general/company-agnostic mode,
 * rather than inventing fake company-branded content.
 *
 * Voice architecture: getInterviewerFollowUp() accepts an inputMode
 * option ('text' today) specifically so a future voice mode (real
 * speech-to-text) could pass transcribed text through the same
 * function without changing any call site — see the spec's explicit
 * instruction to prepare the architecture without building real voice
 * functionality now.
 */

import { getProblems } from '../data/problemStore.js'
import { submitSolution } from './submissionService.js'
import { getHint } from './aiService.js'
import { isPassingStatus } from '../utils/testStatus.js'

export const INTERVIEW_TIME_LIMITS_SECONDS = {
  Easy: 20 * 60,
  Medium: 30 * 60,
  Hard: 45 * 60,
}

export const MAX_HINTS_PER_INTERVIEW = 1

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function pickInterviewProblem({ difficulty, topic } = {}) {
  // Computed fresh on every call (not cached at module load) so an
  // admin-added problem with a full description can show up here too.
  let pool = getProblems().filter((p) => Boolean(p.description))
  if (difficulty) pool = pool.filter((p) => p.difficulty === difficulty)
  if (topic) pool = pool.filter((p) => p.topic === topic)
  if (pool.length === 0) pool = getProblems().filter((p) => Boolean(p.description)) // fall back rather than returning nothing
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function getInterviewerOpening(problem) {
  await delay(500)
  return (
    `This is a mock response. Let's begin. Here's your problem: "${problem.title}". Take a moment to ` +
    "read it, then briefly explain your initial approach before you start coding — that's something " +
    'real interviewers pay close attention to.'
  )
}

/**
 * @param {string} approachText
 * @param {{ inputMode?: 'text' | 'voice' }} [options] - inputMode is
 *   architecture for a future voice mode; only 'text' has real logic
 *   today, per the spec's instruction not to build voice yet.
 */
export async function getInterviewerFollowUp(approachText, { inputMode = 'text' } = {}) {
  await delay(600)

  if (inputMode === 'voice') {
    // Not implemented — see the module comment. Kept here so the shape
    // exists rather than being invented later as an afterthought.
    throw new Error('Voice input is not implemented in this demo.')
  }

  if (!approachText || approachText.trim().length < 10) {
    return (
      'This is a mock response. Try to say a bit more before coding — even a one-line "I\'d check a ' +
      "hash map for O(1) lookups\" is more useful to an interviewer than starting silently."
    )
  }

  return (
    'This is a mock response. That sounds reasonable — go ahead and code it up. A real interviewer ' +
    '(Phase 22) would ask a targeted follow-up here based on what you actually said, not this generic ' +
    'acknowledgment.'
  )
}

export async function getControlledHint(problem) {
  // Interview hints are deliberately just the first, smallest clue —
  // not the full graduated system from Phase 11. Asking for more help
  // than that mid-interview is realistic to model as a cost, not a
  // free multi-level menu.
  return getHint({ problem, hintLevel: 1 })
}

/**
 * Ends the interview: runs the (mock) hidden tests via the same
 * submissionService used on the problem page, then produces mock
 * interview feedback. Never claims the code passed unless the mock
 * execution result actually says so — same rule as Phase 10/11.
 */
export async function finishInterview({ problem, code, starterCode, timeTakenSeconds, timeLimitSeconds, hintsUsed }) {
  const executionResult = await submitSolution({ code, starterCode, difficulty: problem.difficulty })
  await delay(900)

  const withinTime = timeTakenSeconds <= timeLimitSeconds
  const accepted = isPassingStatus(executionResult.status)

  return {
    isMock: true,
    executionResult,
    withinTime,
    feedback: {
      communication:
        hintsUsed > 0
          ? 'This is a mock response. You used a hint during the session — in a real interview, ' +
            'narrating where you were stuck before asking usually lands better than a silent pause ' +
            'followed by a request.'
          : "This is a mock response. No hints requested — a reasonable sign of confidence, as long " +
            "as it didn't come from rushing past a step you were actually unsure about.",
      problemSolving:
        'This is a mock response. A real interviewer (Phase 22) would compare your stated approach ' +
        'against what you actually implemented, and note whether you considered edge cases before ' +
        'coding rather than after.',
      codeQuality:
        'This is a mock response. Same caveat as the AI Review elsewhere in this app: real, ' +
        'code-specific quality feedback needs Groq connected (Phase 22).',
      improvementTip: accepted
        ? 'This is a mock response. Next time, try narrating your complexity analysis before you ' +
          'finish coding, not only if asked.'
        : 'This is a mock response. Since the (simulated) hidden tests did not all pass, review the ' +
          'failing pattern before your next mock interview rather than moving straight to a new problem.',
    },
  }
}
