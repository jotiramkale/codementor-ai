"""
app/db/session.py

Engine + session factory. No database is running anywhere this was
written (this sandbox has no network access to reach one), so this has
not been executed — but the pattern is the standard, well-documented
SQLAlchemy 2.0 + FastAPI setup: a single Engine, a sessionmaker bound
to it, and a `get_db` generator used as a FastAPI dependency so each
request gets its own Session that's always closed afterward.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: `db: Session = Depends(get_db)`."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
