/**
 * agentService.js
 *
 * Phase 15: multi-agent architecture. Defines the 9 specialized agents
 * from the spec as a registry, plus an orchestrator implementing:
 *   User Request -> Orchestrator -> Select Agent -> Retrieve Context ->
 *   Agent Reasoning -> Groq -> Response -> Optional Critic/Reflection ->
 *   Final Response
 *
 * "Groq" and "Agent Reasoning" are still fully mocked (see aiService.js)
 * — this phase's job is the ROUTING and STRUCTURE around them, not a
 * new LLM integration. Every step below is a real function call with a
 * real, traceable outcome. Nothing here scripts a fake conversation
 * between agents for visual effect — an agent that isn't built yet
 * says so plainly instead of pretending to answer.
 *
 * AiMentor.jsx is the user-facing surface for this orchestrator —
 * orchestrate() below composes chatWithMentor() (Phase 12) and
 * ragService's retrieveContext() (Phase 13) rather than duplicating
 * their logic, so "Agent Reasoning" for general questions is exactly
 * the same real code path those phases already built and verified.
 */

import { chatWithMentor } from './aiService.js'
import { isPassingStatus } from '../utils/testStatus.js'

export const AGENTS = [
  {
    id: 'code-review',
    name: 'Code Review Agent',
    role: 'Correctness, quality, and improvement feedback on a submission',
    status: 'active',
    keywords: ['review my code', 'code quality', 'is my code good'],
  },
  {
    id: 'debug',
    name: 'Debug Agent',
    role: 'Explains why a submission failed, without rewriting it',
    status: 'active',
    keywords: ['debug', 'error', 'wrong', 'why is my', 'bug'],
  },
  {
    id: 'hint',
    name: 'Hint Agent',
    role: 'Graduated hints without spoiling the solution',
    status: 'active',
    keywords: ['hint', 'give me a clue'],
  },
  {
    id: 'complexity',
    name: 'Complexity Agent',
    role: 'Time and space complexity analysis and explanation',
    status: 'active',
    keywords: ['complexity', 'big o', 'time complexity', 'space complexity'],
  },
  {
    id: 'learning-coach',
    name: 'Learning Coach Agent',
    role: 'Study guidance, concept explanations, general coaching',
    status: 'active',
    keywords: ['study', 'improve', 'explain', 'compare', 'roadmap', 'learn', 'optimal'],
  },
  {
    id: 'interview',
    name: 'Interview Agent',
    role: 'Mock interview questions and feedback',
    status: 'planned',
    keywords: ['interview', 'mock interview'],
  },
  {
    id: 'problem-generator',
    name: 'Problem Generator Agent',
    role: 'Generates new practice problems (admin-facing)',
    status: 'planned',
    keywords: ['generate a problem', 'new problem', 'create a problem'],
  },
  {
    id: 'analytics',
    name: 'Analytics Agent',
    role: 'Narrates progress and solving-time trends in plain language',
    status: 'planned',
    keywords: ['analytics', 'my stats', 'my progress'],
  },
  {
    id: 'reflection-critic',
    name: 'Reflection/Critic Agent',
    role: "Reviews another agent's draft response before it's shown",
    status: 'active',
    keywords: [], // never selected directly by a request — runs internally on every turn
  },
]

function selectAgent(text) {
  const lower = text.toLowerCase()
  for (const agent of AGENTS) {
    if (agent.id === 'reflection-critic') continue
    if (agent.keywords.some((keyword) => lower.includes(keyword))) {
      return agent
    }
  }
  return AGENTS.find((a) => a.id === 'learning-coach') // sensible general-purpose default
}

// "Retrieve Required Context" + "Agent Reasoning" + "Groq" from the
// spec's diagram, collapsed into one function per agent type because
// most of that work is real code this app already has, not new logic
// to invent here:
//   - code-review / debug / hint agents need a specific problem's code
//     and execution result, which a general chat message doesn't have —
//     the honest answer is to say so, not fabricate one.
//   - learning-coach / complexity (and the catch-all) delegate straight
//     to chatWithMentor(), which already does its own RAG retrieval
//     (Phase 13) and reply generation (Phase 12).
async function runAgentReasoning(agent, messages) {
  if (agent.status === 'planned') {
    return {
      content: `This is a mock response. The ${agent.name} isn't built yet — it's on the roadmap (see the AI Team panel below) but has no working logic in this demo.`,
      ragContext: [],
    }
  }

  if (agent.id === 'code-review' || agent.id === 'debug' || agent.id === 'hint') {
    const panelName = agent.name.replace(' Agent', '')
    return {
      content:
        `This is a mock response. The ${agent.name} needs a specific problem's code (and, for Debug, ` +
        `a real test result) to do real work — neither exists in a general chat message. Open a ` +
        `problem's page and use its ${panelName} panel there for output grounded in your actual code.`,
      ragContext: [],
    }
  }

  // learning-coach, complexity, and the catch-all default all go here.
  const mentorResult = await chatWithMentor({ messages })
  return { content: mentorResult.reply.content, ragContext: mentorResult.ragContext }
}

/**
 * "Optional Critic/Reflection" — a real check, not decoration. It
 * re-verifies any claim about test results against the actual last
 * result, using the same rule the AI Review and AI Debugger enforce
 * (Phase 10/11's isPassingStatus), as an independent safety net on
 * whatever the agent just drafted. In this app's current pages nothing
 * feeds a real testResults value into the orchestrator yet (AiMentor
 * has no specific problem's execution context), so today this mostly
 * confirms there's nothing to flag — but the check is real and would
 * catch a genuine mismatch the moment a caller does pass testResults.
 */
function runCritic(draftResponse, testResults) {
  if (!testResults) {
    return { revised: draftResponse, note: 'No test-result claim to check against — nothing to critique.' }
  }

  const draftClaimsSuccess = /passed|correct|nice work/i.test(draftResponse)
  const actuallyPassing = isPassingStatus(testResults.status)

  if (draftClaimsSuccess && !actuallyPassing) {
    return {
      revised:
        'This is a mock response. The critic step caught the draft implying success when the last ' +
        `result was actually ${testResults.status} — corrected before showing you this.`,
      note: 'Flagged and corrected a potential false success claim.',
    }
  }

  return {
    revised: draftResponse,
    note: 'Checked the draft against the last test result — consistent, no changes made.',
  }
}

/**
 * The orchestrator. Every field in the returned trace reflects an
 * actual decision this function made, not a scripted illustration.
 *
 * @param {{ messages: Array, testResults?: object|null }} params
 */
export async function orchestrate({ messages, testResults = null }) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const text = lastUserMessage?.content || ''

  const agent = selectAgent(text)
  const { content, ragContext } = await runAgentReasoning(agent, messages)
  const critique = runCritic(content, testResults)

  return {
    isMock: true,
    reply: { role: 'assistant', content: critique.revised },
    ragContext,
    trace: {
      selectedAgent: agent.name,
      agentStatus: agent.status,
      critiqueNote: critique.note,
    },
  }
}
