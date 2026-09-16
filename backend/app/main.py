"""
app/main.py

FastAPI entry point. Run with: uvicorn app.main:app --reload

CORS is configured for the Vite dev server's default origin
(FRONTEND_ORIGIN in .env) — without it, the browser blocks the
frontend's requests to this API even once it's actually connected,
which is an easy thing to forget until it silently breaks everything.

/health is real and requires nothing else to work; it's a reasonable
first thing to test once this actually runs somewhere with the
dependencies installed (not verified in this sandbox — see
backend/README.md for why).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai, auth, problems, submissions
from app.config import settings

app = FastAPI(title="CodeMentor AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(ai.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
