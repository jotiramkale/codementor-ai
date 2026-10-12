import { apiRequest } from './apiClient.js'

export async function getProfile() {
  return apiRequest('/api/auth/me')
}

export async function getMemory() {
  const entries = await apiRequest('/api/memory')
  const byCategory = (category) => entries
    .filter((item) => item.category === category)
    .map((item) => ({ topic: item.topic || 'General', note: item.content, id: item.id }))
  return {
    isMock: false,
    entries,
    strengths: byCategory('strength'),
    weakAreas: byCategory('weakness'),
    patterns: byCategory('pattern').map((item) => item.note),
    preferences: byCategory('preference'),
    recentObservations: byCategory('observation').map((item) => ({ when: 'Saved memory', note: item.note })),
  }
}

export async function addMemory({ category, topic, content }) {
  return apiRequest('/api/memory', { method: 'POST', body: { category, topic, content } })
}

export async function deleteMemory(id) {
  return apiRequest(`/api/memory/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
