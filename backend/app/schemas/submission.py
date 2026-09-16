"""
app/schemas/submission.py

Matches submissionService.js's mock shapes field for field —
runSample()'s and submitSolution()'s return values become these
response models. The status strings ('Accepted' | 'Wrong Answer' |
'Runtime Error', and 'passed' | 'failed' | 'error' for sample runs) are
kept identical on purpose so nothing on the frontend has to change its
string comparisons once this is real.
"""

from pydantic import BaseModel


class RunRequest(BaseModel):
    problem_id: int
    code: str
    language: str


class SubmitRequest(BaseModel):
    problem_id: int
    code: str
    language: str
    solving_time: int | None = None  # seconds, from the frontend's Phase 9 timer


class SampleTestResult(BaseModel):
    id: int
    passed: bool
    runtime_ms: float | None = None
    input: str | None = None
    expected_output: str | None = None
    actual_output: str | None = None


class RunResult(BaseModel):
    status: str  # 'passed' | 'failed' | 'error'
    tests: list[SampleTestResult] = []
    error: str | None = None


class SubmissionResult(BaseModel):
    id: int
    status: str  # 'Accepted' | 'Wrong Answer' | 'Runtime Error'
    passed_tests: int
    total_tests: int
    runtime_ms: float | None = None
    memory_mb: float | None = None
    failure_detail: str | None = None
