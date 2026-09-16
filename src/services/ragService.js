/**
 * ragService.js
 *
 * Phase 13: RAG (Retrieval-Augmented Generation) architecture — genuinely
 * built now, backed by a small, honestly-labeled knowledge base instead
 * of a real vector database. Phase 23 swaps the retrieval mechanism
 * (keyword matching -> real embeddings + ChromaDB) without changing
 * this function's signature or any calling code.
 *
 * Pipeline this represents:
 *   User Question -> Retriever -> Relevant Knowledge -> Prompt -> LLM -> Answer
 * This file is the "Retriever -> Relevant Knowledge" step. aiService.js's
 * chatWithMentor() calls retrieveContext() and folds the result into the
 * prompt/reply — see its comments for the "Prompt -> LLM -> Answer" side.
 *
 * IMPORTANT: every knowledge entry's `source` below is honest about
 * where it actually came from — notes written for this demo, not a
 * citation to an external book, article, or site. Never invent a
 * citation to a document that doesn't exist. If a real external source
 * is ever added later, it must be one that's actually been read and can
 * be pointed to, not a plausible-sounding guess.
 *
 * Real path (Phase 23), for reference:
 *   const queryEmbedding = await embed(query)
 *   const results = await chromaCollection.query({ queryEmbeddings: [queryEmbedding], nResults })
 *   return { chunks: results.map(toChunkShape) }
 */

// Phase 18: mutable (was a const) so the admin "manage RAG knowledge"
// screen can genuinely add/edit/delete entries that retrieveContext()
// below actually uses in the same session — not a disconnected admin
// form. See listKnowledgeEntries()/addKnowledgeEntry()/etc. near the
// bottom of this file.
let KNOWLEDGE_BASE = [
  {
    id: 'kb-1',
    domain: 'DSA concepts',
    title: 'What a hash map buys you',
    content:
      'A hash map stores key-value pairs and gives average O(1) lookup, insert, and delete by ' +
      'computing an index from the key. It trades that speed for extra memory, and in the worst ' +
      'case (many collisions) lookups can degrade to O(n).',
    keywords: ['hash map', 'hashmap', 'hash table', 'dictionary'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-2',
    domain: 'algorithms',
    title: 'Binary search, in one paragraph',
    content:
      "Binary search finds a target in a sorted array by repeatedly halving the search range: " +
      "compare the middle element to the target and discard the half that can't contain it. Each " +
      'step cuts the remaining range in half, giving O(log n) instead of O(n) for a linear scan.',
    keywords: ['binary search', 'sorted array', 'log n'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-3',
    domain: 'complexity',
    title: 'Big-O is about growth, not exact speed',
    content:
      "Big-O describes how an algorithm's running time or memory grows as input size grows, " +
      'ignoring constant factors. An O(n) algorithm can be slower in practice than an O(n^2) one ' +
      'on a small input, but O(n) always wins once n is large enough.',
    keywords: ['big o', 'complexity', 'time complexity', 'space complexity'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-4',
    domain: 'patterns',
    title: 'The two-pointer pattern',
    content:
      'Two-pointer problems use two indices moving through a structure (often a sorted array or a ' +
      'string) instead of nested loops. Common shapes: pointers starting at both ends and moving ' +
      'inward, or both starting at the same end moving at different speeds.',
    keywords: ['two pointer', 'two pointers'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-5',
    domain: 'patterns',
    title: 'Sliding window, when it applies',
    content:
      'Sliding window problems ask for something about every contiguous subarray or substring of a ' +
      'given (or variable) size. Instead of recomputing from scratch for each window, you adjust the ' +
      'running result as the window edges move, usually getting O(n) instead of O(n*k).',
    keywords: ['sliding window', 'subarray', 'substring'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-6',
    domain: 'common mistakes',
    title: 'Off-by-one errors',
    content:
      'The most common source of off-by-one bugs is a loop or index boundary: using < where you ' +
      'meant <=, or starting a loop at 0 when the problem is 1-indexed. If a solution fails only on ' +
      'the first or last element, check loop boundaries before re-reading the whole algorithm.',
    keywords: ['off by one', 'off-by-one', 'boundary', 'index error'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-7',
    domain: 'common mistakes',
    title: 'Forgetting edge cases',
    content:
      'Empty input, a single-element input, and duplicate values are the three edge cases that ' +
      "break the most otherwise-correct solutions. Testing against these three before submitting " +
      "catches a large share of 'my logic is right but it still fails' situations.",
    keywords: ['edge case', 'empty input', 'duplicate'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-8',
    domain: 'hints',
    title: 'What makes a good hint',
    content:
      'A good hint narrows the search space without handing over the answer — it points at a ' +
      "technique or a missing observation, not a line of code. This app's graduated hint system " +
      '(Phase 11) is built around that: a small conceptual clue, then a stronger direction, then ' +
      'near-solution guidance, never the solution itself.',
    keywords: ['hint', 'hints', 'good hint'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-9',
    domain: 'interview patterns',
    title: 'What interviewers usually watch for',
    content:
      'Beyond a correct final answer, interviewers typically notice whether you clarify ambiguous ' +
      "requirements before coding, whether you talk through your approach's complexity, and whether " +
      'you test your own solution against an edge case unprompted.',
    keywords: ['interview', 'interview patterns', 'interviewer'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
  {
    id: 'kb-10',
    domain: 'learning roadmaps',
    title: 'A reasonable topic order',
    content:
      'A common learning order is Arrays and Strings first (they underlie almost everything else), ' +
      'then Hashing, then Linked Lists/Stacks/Queues, then Trees and Graphs, then Dynamic ' +
      'Programming and Greedy last, since those build on comfort with the earlier structures.',
    keywords: ['roadmap', 'what to study', 'study next', 'learning order', 'study plan'],
    source: 'CodeMentor AI knowledge base (demo entry)',
  },
]

export const KNOWLEDGE_DOMAINS = [
  'DSA concepts',
  'algorithms',
  'complexity',
  'patterns',
  'common mistakes',
  'hints',
  'interview patterns',
  'learning roadmaps',
]

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function scoreRelevance(query, entry) {
  const text = query.toLowerCase()
  let matches = 0
  for (const keyword of entry.keywords) {
    if (text.includes(keyword)) matches += 1
  }
  return matches
}

/**
 * Retrieves the most relevant knowledge entries for a question.
 * @param {string} query
 * @param {{ maxResults?: number }} [options]
 * @returns {Promise<{ chunks: Array<{ id, domain, title, content, source, relevance }> }>}
 */
export async function retrieveContext(query, { maxResults = 2 } = {}) {
  await delay(300)

  if (!query || !query.trim()) {
    return { chunks: [] }
  }

  const scored = KNOWLEDGE_BASE.map((entry) => {
    const matches = scoreRelevance(query, entry)
    return { entry, relevance: matches / entry.keywords.length }
  })
    .filter((s) => s.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults)

  return {
    chunks: scored.map(({ entry, relevance }) => ({
      id: entry.id,
      domain: entry.domain,
      title: entry.title,
      content: entry.content,
      source: entry.source,
      relevance: Math.min(1, relevance),
    })),
  }
}

/**
 * Phase 18: admin CRUD over the knowledge base. Every entry created or
 * edited here keeps the same honesty rule from the top of this file —
 * the admin UI hardcodes the source to the same demo label rather than
 * letting an arbitrary citation be typed in, so this can't become a
 * back door for the fake-citation problem this file was built to avoid.
 */

export function listKnowledgeEntries() {
  return KNOWLEDGE_BASE
}

let nextKnowledgeId = KNOWLEDGE_BASE.length + 1

export function addKnowledgeEntry({ domain, title, content, keywords }) {
  const entry = {
    id: `kb-admin-${nextKnowledgeId}`,
    domain,
    title,
    content,
    keywords,
    source: 'CodeMentor AI knowledge base (demo entry)',
  }
  nextKnowledgeId += 1
  KNOWLEDGE_BASE = [...KNOWLEDGE_BASE, entry]
  return entry
}

export function updateKnowledgeEntry(id, updates) {
  KNOWLEDGE_BASE = KNOWLEDGE_BASE.map((entry) => (entry.id === id ? { ...entry, ...updates, source: entry.source } : entry))
  return KNOWLEDGE_BASE.find((entry) => entry.id === id)
}

export function deleteKnowledgeEntry(id) {
  KNOWLEDGE_BASE = KNOWLEDGE_BASE.filter((entry) => entry.id !== id)
}
