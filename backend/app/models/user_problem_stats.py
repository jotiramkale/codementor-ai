"""
app/models/user_problem_stats.py

The original spec named `user_problem_stats` as a core table but didn't
list its fields — inferred here from how the frontend actually uses
per-problem stats. Phase 5's Problems catalog shows attempts, best
solving time, and solved status per problem, but those are properties
of a (user, problem) PAIR, not the problem itself. The frontend's mock
data currently stores them directly on the problem object
(problemsMockData.js), which only works because the demo has one
implicit user; a real multi-user system needs this separate table so
two different students don't share one "solved" status on one problem.
"""

from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserProblemStats(Base):
    __tablename__ = "user_problem_stats"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), primary_key=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    best_time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solved: Mapped[bool] = mapped_column(Boolean, default=False)
