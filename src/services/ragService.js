import { apiRequest } from './apiClient.js'

export const KNOWLEDGE_DOMAINS = [
  'DSA concepts', 'algorithms', 'complexity', 'patterns', 'common mistakes',
  'hints', 'interview patterns', 'learning roadmaps',
]

/** Uses the authenticated chat endpoint so retrieved passages are the exact ones sent to Groq. */
export async function retrieveContext(query, { maxResults = 2 } = {}) {
  if (!query?.trim()) return { chunks: [] }
  const result = await apiRequest('/api/ai/chat', {
    method: 'POST', body: { messages: [{ role: 'user', content: query.trim().slice(0, 4000) }] },
  })
  return { chunks: (result.rag_context || []).slice(0, maxResults) }
}

export async function listKnowledgeEntries() {
  return apiRequest('/api/rag/knowledge')
}

export async function addKnowledgeEntry({ domain, title, content }) {
  return apiRequest('/api/rag/knowledge', {
    method: 'POST',
    body: { domain, title, content, source: 'CodeMentor AI admin-authored learning note' },
  })
}

export async function updateKnowledgeEntry(id, updates) {
  return apiRequest(`/api/rag/knowledge/${encodeURIComponent(id)}`, {
    method: 'PUT', body: { domain: updates.domain, title: updates.title, content: updates.content },
  })
}

export async function deleteKnowledgeEntry(id) {
  return apiRequest(`/api/rag/knowledge/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
