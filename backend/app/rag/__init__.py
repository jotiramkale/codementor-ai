"""
app/rag — not implemented yet.

Real embeddings + ChromaDB, replacing the frontend's keyword-matching
retriever (ragService.js, Phase 13). The frontend's knowledge base (10
entries across 8 domains, each with an honestly-labeled source — never
a fabricated citation) is the real seed content to embed and load into
a ChromaDB collection here; the retrieval CONTRACT (query in, ranked
chunks with domain/title/content/source/relevance out) should stay
identical so the frontend doesn't need to change how it reads a
retrieval result, only where it comes from. Planned for Phase 23.
"""
