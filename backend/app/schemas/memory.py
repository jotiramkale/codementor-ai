"""Authenticated contracts for user-owned semantic learning observations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MemoryCategory = Literal["strength", "weakness", "pattern", "preference", "observation"]


class MemoryCreate(BaseModel):
    category: MemoryCategory
    topic: str = Field(default="", max_length=120)
    content: str = Field(min_length=3, max_length=2000)

    model_config = ConfigDict(extra="forbid")


class MemoryOut(BaseModel):
    id: str
    category: MemoryCategory
    topic: str
    content: str
    created_at: str
    relevance: float | None = None


class MemorySearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    limit: int = Field(default=5, ge=1, le=10)

    model_config = ConfigDict(extra="forbid")
