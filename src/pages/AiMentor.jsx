import { useEffect, useRef, useState } from 'react'
import { FiCpu, FiSend } from 'react-icons/fi'
import Panel from '../components/ui/Panel.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import { orchestrate, AGENTS } from '../services/agentService.js'

const SUGGESTED_PROMPTS = [
  'What should I study next?',
  'How can I improve my coding?',
  'Explain the optimal approach for two pointers',
  'Compare BFS and DFS',
]

// Conversation history is sent to the authenticated Groq-backed API.
function AiMentor() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    const userMessage = { id: Date.now(), role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)

    try {
      const result = await orchestrate({ messages: nextMessages })
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isMock: result.isMock,
          ragContext: result.ragContext,
          trace: result.trace,
          ...result.reply,
        },
      ])
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        isMock: false,
        content: `I couldn't complete that request. ${error.message}`,
      }])
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">AI Mentor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ask about concepts, hints, approaches, or what to study next.
        </p>
      </header>

      <Panel title="Conversation" action={<Badge tone="ai">AI</Badge>} className="flex h-[65vh] flex-col">
        <div className="flex-1 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <FiCpu className="mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">
                Ask me anything about DSA, your approach, or what to study next.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                    message.role === 'user' ? 'ml-auto bg-amber-400/10 text-zinc-100' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {message.role === 'assistant' && message.isMock && (
                    <Badge tone="neutral" className="mb-1.5">
                      MOCK
                    </Badge>
                  )}
                  {message.trace && (
                    <p className="mb-1 text-xs text-indigo-300">Handled by: {message.trace.selectedAgent}</p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                  {message.ragContext && message.ragContext.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5 border-t border-zinc-800 pt-2">
                      <p className="text-xs text-zinc-500">
                        Retrieved {message.ragContext.length}{' '}
                        {message.ragContext.length === 1 ? 'knowledge entry' : 'knowledge entries'}:
                      </p>
                      {message.ragContext.map((chunk) => (
                        <div key={chunk.id} className="rounded-md bg-zinc-950/60 px-2.5 py-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-zinc-300">{chunk.title}</span>
                            <span className="shrink-0 text-zinc-600">
                              {Math.round(chunk.relevance * 100)}% relevance
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-2 text-zinc-500">
                            <span>{chunk.domain}</span>
                            <span>{chunk.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.userMemoryUsed?.length > 0 && (
                    <p className="mt-2 border-t border-zinc-800 pt-2 text-xs text-zinc-500">
                      Personalized with {message.userMemoryUsed.length} private learning note{message.userMemoryUsed.length === 1 ? '' : 's'}.
                    </p>
                  )}

                  {message.trace && (
                    <p className="mt-2 border-t border-zinc-800 pt-2 text-xs text-zinc-600">
                      Critic: {message.trace.critiqueNote}
                    </p>
                  )}
                </div>
              ))}
              {isSending && <p className="text-xs text-zinc-600">AI Mentor is thinking…</p>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI Mentor…"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-400"
          />
          <Button type="submit" variant="ai" disabled={isSending || !input.trim()} aria-label="Send">
            <FiSend className="h-4 w-4" />
          </Button>
        </form>
      </Panel>

      <p className="mt-3 text-xs text-zinc-600">
        This conversation isn't saved — refreshing or leaving this page clears it. Real memory across
        sessions arrives with Phase 14.
      </p>

      <Panel title="Multi-agent architecture (planned)" className="mt-4" action={<Badge tone="neutral">Planned</Badge>}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="neutral">Your request</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Future orchestrator</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Select agent</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Specialized agents</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Critic/reflection</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Final response</Badge>
        </div>
        <p className="mb-4 text-sm text-zinc-400">
          This architecture is not active yet. The chat above uses one real mentor endpoint; these specialized
          agents and the reflection step remain planned and are not presented as running.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {AGENTS.filter((agent) => agent.id !== 'reflection-critic').map((agent) => (
            <div key={agent.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-zinc-200">{agent.name}</span>
                <Badge tone={agent.status === 'active' ? 'success' : 'neutral'}>
                  {agent.status === 'active' ? 'Active' : 'Planned'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{agent.role}</p>
            </div>
          ))}
        </div>

      </Panel>

      <Panel title="How the AI Mentor retrieves knowledge" className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="neutral">Your question</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Retriever</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Relevant knowledge</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Prompt</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Groq + private memory</Badge>
          <span className="text-zinc-700">→</span>
          <Badge tone="neutral">Answer</Badge>
        </div>
        <p className="mt-3 text-sm text-zinc-400">The chat sends your conversation to the authenticated backend. ChromaDB retrieves shared knowledge and only your own relevant memory before Groq generates a reply. Multi-agent routing and critic review remain planned; the backend currently returns a single mentor response.</p>
      </Panel>
    </div>
  )
}

export default AiMentor
