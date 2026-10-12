# API Contracts

FastAPI serves live, interactive docs at `/docs` (Swagger) and `/redoc`
once this is running — generated automatically from the Pydantic
schemas and route definitions below. This file is a quick human
reference alongside that, not a replacement for it.

Student API shapes use validated Pydantic contracts. The frontend uses
these authenticated endpoints for account, problem, submission, AI,
knowledge, memory, and progress flows.

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
| GET | `/api/problems/{id}/test-cases` | Bearer token, admin | — | `list[TestCaseOut]` (includes hidden cases) |
| POST | `/api/problems` | Bearer token, admin | `ProblemCreate` | `ProblemOut` (201) |
| PUT | `/api/problems/{id}` | Bearer token, admin | `ProblemUpdate` | `ProblemOut` (404 if missing) |
| DELETE | `/api/problems/{id}` | Bearer token, admin | — | 204, no body |

`attempts`/`best_time_seconds`/`solved` on `ProblemOut` come from
`user_problem_stats`, scoped to whichever user is making the request —
never stored on the problem row, so two students never share state on
the same problem.

## Submissions (`app/api/submissions.py`) — real Docker execution

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/submissions/run` | Bearer token | `RunRequest` | `RunResult` (public cases only) |
| POST | `/api/submissions/submit` | Bearer token | `SubmitRequest` | `SubmissionResult` (aggregate only) |
| GET | `/api/submissions/history` | Bearer token | optional `problem_id`, `limit` | `list[SubmissionHistoryOut]` (current user only) |

## Learning progress (`app/api/progress.py`) — per-user PostgreSQL analytics

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/progress/me` | Bearer token | — | `ProgressSummary` |
| POST | `/api/progress/recommendations` | Bearer token | — | `ProgressRecommendations` |

Progress is computed from persisted submissions and their problem metadata;
the account ID always comes from the bearer token. Accuracy is accepted
submissions divided by saved submit attempts. Topic mastery is the fraction
of distinct attempted problems in that topic with at least one accepted
submission. Solving-time charts use accepted submissions with the
client-reported problem-page timer duration and UTC calendar weeks; these
times are not independently verified. `Run` requests are not saved and do
not affect progress. Empty histories return zero/empty values rather than demo
metrics. Recommendations are generated on demand by Groq from aggregate
metrics only; source code is never included in that request.

Submissions execute complete programs that read each test's `input`
from stdin and write their answer to stdout. Java submissions use
`public class Main`; C++ uses C++20. The backend does not adapt the
frontend's function-only editor snippets in this phase. Output
comparison normalizes line endings and trims trailing whitespace.

`Run` selects only test cases with `hidden=false` and may return their
input, expected output, and actual output. `Submit` selects every case,
persists the submission and per-user problem stats, and never returns
hidden inputs, expected/actual outputs, or failing hidden case indexes.
The database's `runtime` records measured execution time in
milliseconds; `memory` remains null because memory is enforced by
Docker but not measured per process yet.

Status strings are `Accepted`, `Wrong Answer`, `Compilation Error`,
`Runtime Error`, `Time Limit Exceeded`, `Memory Limit Exceeded`, and
`Output Limit Exceeded`. Sample Run maps these to `passed`, `failed`, or
`error`. Docker/image unavailability returns 503, execution capacity
returns 429, invalid execution data returns 422, and missing problem
test data returns 409. There is no local-process or mock fallback.

The sandbox policy is in `app/execution/docker_policy.py`; the trusted
runner and per-language images are under `execution/docker/`. Build
images manually as described in `README.md`. Runtime requests use
`--pull=never` and never mount the Docker socket or the host filesystem.

## AI (`app/api/ai.py`) — live Groq model with ChromaDB retrieval

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/ai/review` | Bearer token | `ReviewRequest` | `ReviewResponse` |
| POST | `/api/ai/review-code` | Bearer token | `SimpleReviewRequest` | `SimpleReviewResponse` |
| POST | `/api/ai/hint` | Bearer token | `HintRequest` | `HintResponse` |
| POST | `/api/ai/debug` | Bearer token | `DebugRequest` | `DebugResponse` |
| POST | `/api/ai/chat` | Bearer token | `ChatRequest` | `ChatResponse` |
| POST | `/api/ai/problem-draft` | Bearer token, admin | `ProblemDraftRequest` | `ProblemDraft` |

All AI model endpoints call Groq using `GROQ_MODEL` (default
`openai/gpt-oss-120b`). The backend requires `GROQ_API_KEY` and returns
503 when it is missing or 502 when the provider response fails validation.
Review, hint, debug, chat, and the original prototype review use Groq's
strict JSON Schema response mode where structured data is returned.
`/review-code` preserves the original free-form problem statement + code
review flow, but clearly marks its correctness analysis as inspection
only because no execution evidence is supplied. `/problem-draft` is
admin-only and returns an unverified draft; it does not create or publish
a problem, and an administrator must review generated content first.
Review and debug ignore the optional, legacy client `test_results` field.
They use only a persisted submission by the same user with exactly the
same problem, language, and source; otherwise the model is told execution
is unverified. The database currently stores aggregate submission status,
not per-test results or compiler output, so those details are never
invented. Hints use the problem's stored hints as grounding. Chat retrieves
ranked knowledge chunks from ChromaDB, includes those exact chunks in the
Groq prompt, and returns them in `rag_context` with their real source and
similarity score. It separately reports only the authenticated user's
matching saved memories. Chat history accepts at most 20 alternating
messages and 24,000 total characters, and must end with a user turn; the
browser keeps older visible turns but trims provider context to that
contract. `trace` remains null because agent orchestration is not
implemented in the backend yet. Requests are authenticated and bounded;
provider error details and credentials are not returned to callers.
Configuration also supports `GROQ_REASONING_EFFORT` (`low`, `medium`, or
`high`).

## RAG knowledge (`app/api/rag.py`) — persistent ChromaDB

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/rag/status` | Bearer token, admin | — | `KnowledgeStatus` |
| GET | `/api/rag/knowledge` | Bearer token, admin | optional `domain`, `limit` | `list[KnowledgeOut]` |
| POST | `/api/rag/knowledge` | Bearer token, admin | `KnowledgeCreate` | `KnowledgeOut` (201) |
| PUT | `/api/rag/knowledge/{id}` | Bearer token, admin | `KnowledgeUpdate` | `KnowledgeOut` |
| DELETE | `/api/rag/knowledge/{id}` | Bearer token, admin | — | 204 |

The knowledge store is shared educational material, not per-user memory.
Entries keep an admin-supplied `source` string as provenance; the service
does not invent external citations. Long content is split into bounded
chunks before embedding. A local `PersistentClient` writes under
`CHROMA_PERSIST_DIR`; the configured Sentence Transformers model is
`RAG_EMBEDDING_MODEL`. The first RAG request loads dependencies/model and
seeds the ten clearly labeled CodeMentor demo entries if this collection
has not been initialized. The admin UI uses the protected CRUD endpoints;
chat returns the exact retrieved excerpt, source, and relevance score that
were supplied to Groq.

## User memory (`app/api/memory.py`) — private ChromaDB observations

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/memory` | Bearer token | optional `limit` (1–500) | `list[MemoryOut]` |
| POST | `/api/memory` | Bearer token | `MemoryCreate` | `MemoryOut` (201) |
| POST | `/api/memory/search` | Bearer token | `MemorySearchRequest` | `list[MemoryOut]` |
| DELETE | `/api/memory/{id}` | Bearer token | — | 204 (404 if absent or owned by someone else) |

The service derives ownership only from the authenticated database user's
ID; callers cannot provide or override `user_id`. Chroma queries, lists,
and deletes filter by both `kind=memory` and that ID. User memory has its
own `RAG_MEMORY_COLLECTION_NAME` collection, separate from shared
educational knowledge. Entries support strength, weakness, pattern,
preference, and observation categories. Chat can retrieve up to three
relevant observations for the current user and passes them to the model
as fallible private context. The response reports these separately in
`user_memory_used`, never as cited RAG sources. The current API stores
explicitly submitted observations; automatic learning/extraction from
chat is not enabled. Structured progress facts continue to use
PostgreSQL. Profile UI is still a local mock until Phase 25.
