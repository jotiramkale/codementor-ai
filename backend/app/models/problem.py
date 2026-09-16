"""
app/models/problem.py

Extends the original spec's `problems` table (id, title, description,
difficulty, topic, constraints, sample_input, sample_output) with
columns 18 phases of frontend work turned out to actually need:
multiple examples (not one sample), hints, per-language starter code,
estimated_time, and ai_recommended. This is a documented, explained
extension — not a silent deviation — because this genuinely is the
right moment to reconcile the original schema with what got built:
Phase 20 is where this gets finalized for real.
"""

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Problem(Base):
    __tablename__ = "problems"

    # --- Original spec fields ---
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20))  # 'Easy' | 'Medium' | 'Hard'
    topic: Mapped[str] = mapped_column(String(50))
    # The original spec had one `constraints` field and separate
    # `sample_input`/`sample_output` strings. The frontend's Problems
    # catalog (Phase 5-6) needs MULTIPLE constraints and MULTIPLE
    # worked examples per problem, so both became JSON arrays — see
    # `examples` below for what absorbed sample_input/sample_output.
    constraints: Mapped[list[str] | None] = mapped_column(JSON, default=list)

    # --- Added to match what the frontend actually needs (Phase 5-9) ---
    expected_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    examples: Mapped[list[dict] | None] = mapped_column(JSON, default=list)  # [{input, output, explanation}]
    hints: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    starter_code: Mapped[dict | None] = mapped_column(JSON, default=dict)  # {python, javascript, java, cpp}
    estimated_time: Mapped[str | None] = mapped_column(String(20), nullable=True)  # display string, e.g. "15m"
    ai_recommended: Mapped[bool] = mapped_column(default=False)

    test_cases: Mapped[list["TestCase"]] = relationship(back_populates="problem", cascade="all, delete-orphan")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="problem")
