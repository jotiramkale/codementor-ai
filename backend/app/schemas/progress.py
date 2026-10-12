"""Authenticated learning progress and recommendation contracts."""

from datetime import date

from pydantic import BaseModel, Field


class DifficultyProgress(BaseModel):
    difficulty: str
    solved: int = Field(ge=0)


class WeeklySolvingTime(BaseModel):
    week_start: date
    week: str
    minutes: float | None = Field(default=None, ge=0)
    accepted_submissions: int = Field(ge=0)


class TopicMastery(BaseModel):
    topic: str
    mastery: float = Field(ge=0, le=100)
    solved: int = Field(ge=0)
    attempted: int = Field(ge=0)


class ProgressSummary(BaseModel):
    problems_solved: int = Field(ge=0)
    accuracy: float = Field(ge=0, le=100)
    total_attempts: int = Field(ge=0)
    accepted_attempts: int = Field(ge=0)
    current_streak: int = Field(ge=0)
    average_solving_time_seconds: float | None = Field(default=None, ge=0)
    difficulty_distribution: list[DifficultyProgress]
    solving_time_trend: list[WeeklySolvingTime]
    topic_mastery: list[TopicMastery]
    recent_improvements: list[str]


class ProgressRecommendations(BaseModel):
    recommendations: list[str] = Field(min_length=1, max_length=5)

