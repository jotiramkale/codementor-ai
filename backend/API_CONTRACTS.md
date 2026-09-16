# API Contracts

FastAPI serves live, interactive docs at `/docs` (Swagger) and `/redoc`
once this is running — generated automatically from the Pydantic
schemas and route definitions below. This file is a quick human
reference alongside that, not a replacement for it.

Every shape below is matched field-for-field against what the
frontend's mock services already send/expect (see each schema file's
docstring for exactly which frontend file it mirrors), so connecting
the two later should mean flipping `USE_MOCK` flags, not redesigning
either side.

## Auth (`app/api/auth.py`) — real

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/auth/signup` | none | `SignUpRequest` | `TokenResponse` (201) |
| POST | `/api/auth/signin` | none | `SignInRequest` | `TokenResponse` |
| GET | `/api/auth/me` | Bearer token | — | `UserOut` |

`SignUpRequest` has no admin/role field — see `app/schemas/auth.py`'s
docstring for why that's a deliberate security choice, not an
oversight.

## Problems (`app/api/problems.py`) — real

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/problems` | Bearer token | — | `list[ProblemOut]` |
| GET | `/api/problems/{id}` | Bearer token | — | `ProblemOut` (404 if missing) |
| POST | `/api/problems` | Bearer token, admin | `ProblemCreate` | `ProblemOut` (201) |
| PUT | `/api/problems/{id}` | Bearer token, admin | `ProblemUpdate` | `ProblemOut` (404 if missing) |
| DELETE | `/api/problems/{id}` | Bearer token, admin | — | 204, no body |

`attempts`/`best_time_seconds`/`solved` on `ProblemOut` come from
`user_problem_stats`, scoped to whichever user is making the request —
never stored on the problem row, so two students never share state on
the same problem.

## Submissions (`app/api/submissions.py`) — stub, 501

| Method | Path | Auth | Request | Response when built |
|---|---|---|---|---|
| POST | `/api/submissions/run` | Bearer token | `RunRequest` | `RunResult` |
| POST | `/api/submissions/submit` | Bearer token | `SubmitRequest` | `SubmissionResult` |

Blocked on Phase 21 (Docker sandbox execution). Status strings
(`'Accepted'`, `'Wrong Answer'`, `'Runtime Error'`, and `'passed'` /
`'failed'` / `'error'` for sample runs) are fixed now so the frontend's
existing string comparisons don't need to change later.

## AI (`app/api/ai.py`) — stub, 501

| Method | Path | Auth | Request | Response when built |
|---|---|---|---|---|
| POST | `/api/ai/review` | Bearer token | `ReviewRequest` | `ReviewResponse` |
| POST | `/api/ai/hint` | Bearer token | `HintRequest` | `HintResponse` |
| POST | `/api/ai/debug` | Bearer token | `DebugRequest` | `DebugResponse` |
| POST | `/api/ai/chat` | Bearer token | `ChatRequest` | `ChatResponse` |

Blocked on Phase 22 (Groq); `/chat` additionally needs Phase 23 (real
RAG) to be more than keyword matching. `ReviewRequest`/`DebugRequest`
both carry an optional `TestResultContext` — the same "never claim
success unless execution data says so" rule from the frontend's Phase
10/11 has to be enforced here too once these are real, not just on the
frontend.

## Not yet routed at all

- User memory (Phase 14's frontend feature) — needs its own endpoint
  once Phase 24 gives it a real ChromaDB-backed store; `app/models/`
  has no table for it yet, on purpose, since semantic memory belongs in
  a vector store, not a relational one (see the original spec's
  architecture notes).
- RAG knowledge management (Phase 18's frontend admin feature) — needs
  endpoints once Phase 23 replaces `ragService.js`'s in-memory array
  with ChromaDB.
