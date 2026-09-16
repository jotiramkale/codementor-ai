"""
app/models/user.py

Matches the `users` table from the original project spec exactly:
id, name, email, password_hash, role, created_at. `role` already
existed in that spec before Phase 18's frontend admin work — the
frontend's mock 'student'|'admin' distinction lines up with a column
that was always part of the plan, not something invented to patch it
in after the fact.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # Never store a plaintext password — see app/auth/security.py for
    # the real hashing (argon2 via passlib) that produces this value.
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="student")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    submissions: Mapped[list["Submission"]] = relationship(back_populates="user")
    progress: Mapped["Progress | None"] = relationship(back_populates="user")
