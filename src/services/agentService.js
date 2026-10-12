import { chatWithMentor } from './aiService.js'

// These roles describe the planned multi-agent system. Current requests use
// one authenticated Mentor endpoint and do not claim agent-level routing.
export const AGENTS = [
  { id: 'code-review', name: 'Code Review Agent', role: 'Correctness, quality, and improvement feedback', status: 'planned' },
  { id: 'debug', name: 'Debug Agent', role: 'Explains why a submission failed', status: 'planned' },
  { id: 'hint', name: 'Hint Agent', role: 'Graduated hints without spoiling the solution', status: 'planned' },
  { id: 'complexity', name: 'Complexity Agent', role: 'Time and space analysis', status: 'planned' },
  { id: 'learning-coach', name: 'Learning Coach Agent', role: 'Study guidance and concept explanations', status: 'planned' },
  { id: 'interview', name: 'Interview Agent', role: 'Interview questions and feedback', status: 'planned' },
  { id: 'problem-generator', name: 'Problem Generator Agent', role: 'Creates reviewable problem drafts', status: 'planned' },
  { id: 'analytics', name: 'Analytics Agent', role: 'Explains progress and solving-time trends', status: 'planned' },
  { id: 'reflection-critic', name: 'Reflection/Critic Agent', role: 'Reviews model responses', status: 'planned' },
]

export async function orchestrate({ messages }) {
  const result = await chatWithMentor({ messages })
  return {
    isMock: false,
    reply: result.reply,
    ragContext: result.ragContext,
    userMemoryUsed: result.userMemoryUsed,
    trace: result.trace,
  }
}
