"""
app/schemas/problem.py

Shapes matching the frontend's problemsMockData.js / problemStore.js
objects field for field, so the real API can be a drop-in replacement
for the mock data the frontend already filters and renders against
(Phase 5-9, 18).
"""

from pydantic import BaseModel


class ExampleSchema(BaseModel):
    input: str
    output: str
    explanation: str | None = None


class TestCaseOut(BaseModel):
    id: int
    input: str
    expected_output: str
    hidden: bool

    model_config = {"from_attributes": True}


class TestCaseCreate(BaseModel):
    input: str
    expected_output: str
    hidden: bool = True


class ProblemOut(BaseModel):
    id: int
    title: str
    difficulty: str
    topic: str
    estimated_time: str | None = None
    description: str
    expected_input: str | None = None
    expected_output: str | None = None
    examples: list[ExampleSchema] = []
    constraints: list[str] = []
    hints: list[str] = []
    starter_code: dict[str, str] = {}
    ai_recommended: bool = False
    # From user_problem_stats, populated per the requesting user — never
    # stored on the problem itself. See models/user_problem_stats.py.
    attempts: int = 0
    best_time_seconds: int | None = None
    solved: bool = False

    model_config = {"from_attributes": True}


class ProblemCreate(BaseModel):
    title: str
    difficulty: str
    topic: str
    estimated_time: str | None = None
    description: str
    expected_input: str | None = None
    expected_output: str | None = None
    examples: list[ExampleSchema] = []
    constraints: list[str] = []
    hints: list[str] = []
    starter_code: dict[str, str] = {}
    test_cases: list[TestCaseCreate] = []


class ProblemUpdate(ProblemCreate):
    pass
