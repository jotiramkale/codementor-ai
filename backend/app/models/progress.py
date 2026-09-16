"""
app/models/progress.py

Matches the original spec's `progress` table. One row per user — the
real backing store for everything Phase 4's Dashboard and Phase 16's
Progress page currently fabricate client-side (dashboardMockData.js,
progressMockData.js). `topic_metrics` is JSON because the frontend
needs per-topic mastery as a growable list (see MOCK_TOPIC_MASTERY),
not a fixed set of columns — a new topic shouldn't require a schema
migration.
"""

from sqlalchemy import JSON, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Progress(Base):
    __tablename__ = "progress"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    solved_count: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    average_solve_time: Mapped[float | None] = mapped_column(Float, nullable=True)  # seconds
    topic_metrics: Mapped[list[dict] | None] = mapped_column(JSON, default=list)  # [{topic, mastery}]

    user: Mapped["User"] = relationship(back_populates="progress")
