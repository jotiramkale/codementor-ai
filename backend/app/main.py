"""FastAPI entry point with safe operational defaults and health checks."""

import logging
import re
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api import ai, auth, memory, problems, progress, rag, submissions
from app.config import settings
from app.db.session import engine

logger = logging.getLogger("codementor.api")
production = settings.environment == "production"
app = FastAPI(
    title="CodeMentor AI API",
    version="0.1.0",
    docs_url=None if production else "/docs",
    redoc_url=None if production else "/redoc",
    openapi_url=None if production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(progress.router)
app.include_router(ai.router)
app.include_router(rag.router)
app.include_router(memory.router)


@app.middleware("http")
async def add_request_context(request: Request, call_next):
    supplied_id = request.headers.get("x-request-id", "")
    request_id = supplied_id if re.fullmatch(r"[A-Za-z0-9._-]{1,64}", supplied_id) else uuid.uuid4().hex
    request.state.request_id = request_id
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(
            "Unhandled API error exception=%s request_id=%s path=%s",
            type(exc).__name__,
            request_id,
            request.url.path,
        )
        response = JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred.", "request_id": request_id},
        )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
def health_check() -> dict[str, str]:
    """Liveness check; it does not require a database or optional AI services."""
    return {"status": "ok"}


@app.get("/health/live", include_in_schema=not production)
def liveness_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", include_in_schema=not production)
def readiness_check():
    """Readiness check verifies the required database without exposing details."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("Readiness database check failed (%s)", type(exc).__name__)
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ready"}
