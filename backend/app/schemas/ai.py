"""Validated request and response contracts for the AI mentor endpoints."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Language = Literal["python", "javascript", "java", "cpp"]


class TestResultContext(BaseModel):
    """Legacy client context; retained for compatibility but never trusted."""

    source: str = Field(max_length=20)
    status: str = Field(max_length=50)
    passed_tests: int = Field(ge=0, le=1000)
    total_tests: int = Field(ge=0, le=1000)

    model_config = ConfigDict(extra="forbid")


class ReviewRequest(BaseModel):
    problem_id: int = Field(gt=0)
    code: str = Field(min_length=1, max_length=50000)
    language: Language
    test_results: TestResultContext | None = None

    model_config = ConfigDict(extra="forbid")


class SimpleReviewRequest(BaseModel):
    """Stateless contract for the original problem-statement/code prototype."""

    problem_statement: str = Field(min_length=1, max_length=12000)
    code: str = Field(min_length=1, max_length=50000)
    language: Language = "python"

    model_config = ConfigDict(extra="forbid")


class SimpleReviewResponse(BaseModel):
    correctness: str
    errors: str
    improvements: str

    model_config = ConfigDict(extra="forbid")


class ReviewResponse(BaseModel):
    overall_assessment: str
    bug_analysis: str
    time_complexity: str
    space_complexity: str
    code_quality: str
    suggested_improvement: str
    learning_tip: str

    model_config = ConfigDict(extra="forbid")


class HintRequest(BaseModel):
    problem_id: int = Field(gt=0)
    hint_level: int = Field(ge=1, le=3)

    model_config = ConfigDict(extra="forbid")


class HintResponse(BaseModel):
    level: Literal[1, 2, 3]
    content: str

    model_config = ConfigDict(extra="forbid")


class DebugRequest(BaseModel):
    problem_id: int = Field(gt=0)
    code: str = Field(min_length=1, max_length=50000)
    language: Language
    test_results: TestResultContext | None = None

    model_config = ConfigDict(extra="forbid")


class DebugResponse(BaseModel):
    likely_cause: str
    debugging_direction: str

    model_config = ConfigDict(extra="forbid")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

    model_config = ConfigDict(extra="forbid")


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_history_contract(self):
        if sum(len(message.content) for message in self.messages) > 24000:
            raise ValueError("Combined conversation content must be at most 24000 characters.")
        if self.messages[0].role != "user" or self.messages[-1].role != "user":
            raise ValueError("Conversation history must start and end with a user message.")
        if any(left.role == right.role for left, right in zip(self.messages, self.messages[1:])):
            raise ValueError("Conversation messages must alternate between user and assistant.")
        return self


class RagChunk(BaseModel):
    id: str
    domain: str
    title: str
    content: str
    source: str
    relevance: float


class ProblemDraftRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=80)
    difficulty: Literal["Easy", "Medium", "Hard"]

    model_config = ConfigDict(extra="forbid")


class ProblemDraftExample(BaseModel):
    input: str = Field(min_length=1, max_length=2000)
    output: str = Field(min_length=1, max_length=2000)
    explanation: str = Field(min_length=1, max_length=2000)

    model_config = ConfigDict(extra="forbid")


class ProblemDraft(BaseModel):
    """AI-authored content is explicitly a draft until an admin verifies it."""

    title: str = Field(min_length=5, max_length=160)
    difficulty: Literal["Easy", "Medium", "Hard"]
    topic: str = Field(min_length=1, max_length=80)
    estimated_time: str = Field(min_length=2, max_length=20)
    description: str = Field(min_length=30, max_length=12000)
    expected_input: str = Field(min_length=1, max_length=2000)
    expected_output: str = Field(min_length=1, max_length=2000)
    examples: list[ProblemDraftExample] = Field(min_length=1, max_length=5)
    constraints: list[str] = Field(min_length=1, max_length=12)
    hints: list[str] = Field(min_length=1, max_length=3)
    starter_code: dict[str, str]
    review_required: Literal[True] = True

    model_config = ConfigDict(extra="forbid")


class AgentTrace(BaseModel):
    selected_agent: str
    agent_status: str
    critique_note: str


class MemoryContext(BaseModel):
    id: str
    category: Literal["strength", "weakness", "pattern", "preference", "observation"]
    topic: str
    content: str
    created_at: str
    relevance: float


class ChatResponse(BaseModel):
    reply: ChatMessage
    rag_context: list[RagChunk] = Field(default_factory=list)
    user_memory_used: list[MemoryContext] = Field(default_factory=list)
    trace: AgentTrace | None = None
