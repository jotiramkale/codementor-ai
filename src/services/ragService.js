/**
 * ragService.js
 * Not used yet — scaffolded ahead of Phase 13 (RAG). Will call the
 * FastAPI retriever, which queries ChromaDB for relevant DSA knowledge
 * before a Groq call. Never fabricate retrieved context in the meantime.
 */

export async function retrieveContext(/* query */) {
  return { chunks: [], source: null }
}
