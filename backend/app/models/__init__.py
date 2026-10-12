"""
app/models/__init__.py

Imports every model so SQLAlchemy's mapper can resolve the string-based
forward references used in relationship() (e.g. Mapped["Submission"])
across files. Anything that needs the ORM should import from here
(`from app import models`) rather than importing individual model
files directly, so this resolution always happens.
"""

from app.models.ai_review import AIReview
from app.models.problem import Problem
from app.models.progress import Progress
from app.models.submission import Submission
from app.models.test_case import TestCase
from app.models.user import User
from app.models.user_problem_stats import UserProblemStats

__all__ = [
    "AIReview",
    "Problem",
    "Progress",
    "Submission",
    "TestCase",
    "User",
    "UserProblemStats",
]
