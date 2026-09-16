# CodeMentor AI backend

FastAPI backend, started in Phase 19. Structure per the original spec's
suggested layout: `app/{main.py, api/, models/, schemas/, services/,
agents/, rag/, execution/, auth/, db/, utils/}`.

## Current status

**New in Phase 20**: real Alembic migrations (`migrations/`) that
actually create the 7-table schema — hand-written since there's no
database here to run `alembic revision --autogenerate` against, but
cross-checked column-by-column against the models (see the report);
a seed script (`app/db/seed.py`) that loads the exact same 29 problems
the frontend's `problemsMockData.js` has used since Phase 5, verified
field-for-field to match by actually parsing both files and diffing
them, not by eye; and `API_CONTRACTS.md`, a human-readable companion to
the auto-generated `/docs` Swagger page.

**Real, complete code** (would run correctly against a live Postgres
instance, once one exists):
- `app/main.py` — FastAPI app, CORS, `/health` (needs nothing else —
  the one thing genuinely testable without a database)
- `app/config.py` — settings loaded from `.env`
- `app/db/` — SQLAlchemy engine/session setup, plus `seed.py` (Phase 20)
- `migrations/` — Alembic setup + the initial schema migration (Phase 20)
- `app/models/` — all 7 tables from the original spec's schema
  (`users`, `problems`, `test_cases`, `submissions`, `ai_reviews`,
  `progress`, `user_problem_stats`), extended where the frontend's 18
  phases of work showed a real need beyond the original field list
  (see the docstring in `app/models/problem.py` for exactly what
  changed and why)
- `app/schemas/` — Pydantic request/response models matched
  field-for-field against the frontend's existing mock service shapes
  (`aiService.js`, `submissionService.js`, `authService.js`,
  `agentService.js`) — this is "prepare API contracts" made concrete
- `app/auth/security.py` — real password hashing (argon2) and real JWT
  encode/decode
- `app/api/auth.py`, `app/api/problems.py` — real, complete route
  logic; both only need a running database, not anything else unbuilt

**Honest stubs** (routes exist with the right path/method/schema, but
return `501 Not Implemented` with a message naming what phase unblocks
them):
- `app/api/submissions.py` — needs Phase 21's execution sandbox
- `app/api/ai.py` — needs Phase 22's Groq connection (chat also needs
  Phase 23's real RAG)

**Not started**: `app/services/`, `app/agents/`, `app/rag/`,
`app/execution/` are placeholder packages with a docstring explaining
what belongs there and which phase builds it — matching the same
pattern the frontend used for its own empty folders back in Phase 1-2.

## An important, deliberate security difference from the frontend

The frontend's `authService.js` has a "sign up/in as admin (demo)"
checkbox — the client tells the mock backend what role to assign. That
only works there because there's no real backend to lie to.
`app/schemas/auth.py`'s `SignUpRequest` has **no such field, on
purpose** — a real backend must never let the client grant itself
privileges. See that file's docstring for the reasoning. Granting admin
access for real needs a trusted, server-side path (a database update
by an existing admin, or a separate invite-only endpoint).

## What has NOT been verified, and why

This sandbox has no internet access, so none of `requirements.txt` was
installed and none of this code has actually been run or imported
against the real `fastapi`/`sqlalchemy`/`pydantic`/`python-jose`/
`passlib` packages. What was verified instead, without those packages:

- Every `.py` file passes `python3 -m py_compile` (real syntax check)
- Every SQLAlchemy `ForeignKey("table.name")` was manually cross-checked
  against actual `__tablename__` values, and every `relationship(...,
  back_populates=...)` pair was checked to reference each other
  correctly
- A custom script parsed every file's AST and confirmed every local
  `from app.x import y` actually resolves to something real (a defined
  class/function or an actual submodule file) — not just "looks right"
- The initial migration's columns were checked one table at a time
  against the actual model files' column definitions, not retyped from
  memory
- `app/db/seed.py`'s 29 problems were verified by actually parsing both
  it and the frontend's `problemsMockData.js` and diffing every field —
  title, difficulty, topic, estimated time, and for the 6 detailed
  problems, description/examples/constraints/hints/starter_code across
  all 4 languages — confirmed a perfect match, not eyeballed

None of that replaces actually running `pip install -r requirements.txt`
and `uvicorn app.main:app --reload` yourself, which is the real test.
Please run that and tell me what breaks — this is by far the piece of
this whole project least exercised so far, since everything before it
was a browser-testable frontend.

## Running it (on your machine, with internet access)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env — at minimum set a real DATABASE_URL pointing at a running
# Postgres instance, and a real JWT_SECRET_KEY (see the comment in
# .env.example for how to generate one)

# Create the schema (Phase 20 — hand-written migration, see
# migrations/versions/0001_initial_schema.py):
alembic upgrade head

# Populate it with the same 29 problems the frontend has used since
# Phase 5, plus two demo accounts:
python -m app.db.seed

uvicorn app.main:app --reload
```

Then `curl http://localhost:8000/health` should return `{"status":
"ok"}`, and — once the two steps above have run — signup/signin/
problems endpoints should work against real data. Demo accounts from
the seed script: `student@example.com` / `admin@example.com`, both
password `changeme123` (change or remove these before anything
resembling production).

## Tests

```bash
pytest tests/ -v
```

Only `tests/test_health.py` exists so far — it needs nothing but the
app itself. More tests belong here as each phase adds real logic
(auth, then problems, then execution, then AI).
