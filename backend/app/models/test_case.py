"""
app/models/test_case.py

Matches the original spec's `test_cases` table exactly. This is the
real backing store for what Phase 18's admin UI called "test cases" on
the frontend (create + hide/unhide) — the frontend built that editing
UI and data shape before this table existed; this is where the data
actually lives once Phase 21 wires real execution up to it.
"""

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"))
    input: Mapped[str] = mapped_column(Text)
    expected_output: Mapped[str] = mapped_column(Text)
    hidden: Mapped[bool] = mapped_column(default=True)

    problem: Mapped["Problem"] = relationship(back_populates="test_cases")
