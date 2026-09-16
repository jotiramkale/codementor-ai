"""
app/models/ai_review.py

Matches the original spec's `ai_reviews` table. `correctness`,
`complexity`, `code_quality` map to the frontend's Phase 10 AI Review
panel sections (Overall Assessment / Time+Space Complexity / Code
Quality); `feedback` and `suggestions` cover Bug Analysis and Suggested
Improvement. One row per submission, not an independently-created
resource.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AIReview(Base):
    __tablename__ = "ai_reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"), unique=True)
    correctness: Mapped[str | None] = mapped_column(Text, nullable=True)
    complexity: Mapped[str | None] = mapped_column(Text, nullable=True)
    code_quality: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggestions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    submission: Mapped["Submission"] = relationship(back_populates="ai_review")
