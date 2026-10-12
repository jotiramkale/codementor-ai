"""
app/schemas/submission.py

Keeps the existing frontend response field names for the later API
integration, while adding objective Docker judge outcomes. The frontend
still calls its mock service in this phase.
"""

from typing import Literal

from pydantic import BaseModel, Field


class RunRequest(BaseModel):
    problem_id: int = Field(gt=0)
    code: str = Field(min_length=1, max_length=262144)
    language: Literal["python", "javascript", "java", "cpp"]


class SubmitRequest(BaseModel):
    problem_id: int = Field(gt=0)
    code: str = Field(min_length=1, max_length=262144)
    language: Literal["python", "javascript", "java", "cpp"]
    solving_time: int | None = Field(default=None, ge=0)  # seconds, from the frontend's Phase 9 timer


class SampleTestResult(BaseModel):
    id: int
    passed: bool
    runtime_ms: float | None = None
    input: str | None = None
    expected_output: str | None = None
    actual_output: str | None = None


class RunResult(BaseModel):
    status: str  # 'passed' | 'failed' | 'error'
    tests: list[SampleTestResult] = Field(default_factory=list)
    error: str | None = None


class SubmissionResult(BaseModel):
    id: int
    # Accepted | Wrong Answer | Compilation Error | Runtime Error |
    # Time Limit Exceeded | Memory Limit Exceeded | Output Limit Exceeded
    status: str
    passed_tests: int
    total_tests: int
    runtime_ms: float | None = None
    memory_mb: float | None = None
    failure_detail: str | None = None


class SubmissionHistoryOut(BaseModel):
    id: int
    problem_id: int
    status: str
    language: str
    runtime_ms: float | None = None
    memory_mb: float | None = None
    solving_time: int | None = None
    attempt_number: int
    created_at: str
