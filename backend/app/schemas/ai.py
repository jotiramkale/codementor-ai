"""
app/schemas/ai.py

Matches aiService.js's mock request/response shapes — reviewSubmission(),
getHint(), debugError(), chatWithMentor() — field for field, plus
agentService.js's orchestrate() trace shape (Phase 15).
"""

from pydantic import BaseModel


class TestResultContext(BaseModel):
    """What reviewSubmission()/debugError() call `testResults` on the frontend."""

    source: str  # 'run' | 'submit'
    status: str
    passed_tests: int
    total_tests: int


class ReviewRequest(BaseModel):
    problem_id: int
    code: str
    language: str
    test_results: TestResultContext | None = None


class ReviewResponse(BaseModel):
    overall_assessment: str
    bug_analysis: str
    time_complexity: str
    space_complexity: str
    code_quality: str
    suggested_improvement: str
    learning_tip: str


class HintRequest(BaseModel):
    problem_id: int
    hint_level: int  # 1, 2, or 3


class HintResponse(BaseModel):
    level: int
    content: str


class DebugRequest(BaseModel):
    problem_id: int
    code: str
    language: str
    test_results: TestResultContext | None = None


class DebugResponse(BaseModel):
    likely_cause: str
    debugging_direction: str


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class RagChunk(BaseModel):
    id: str
    domain: str
    title: str
    content: str
    source: str
    relevance: float


class AgentTrace(BaseModel):
    selected_agent: str
    agent_status: str
    critique_note: str


class ChatResponse(BaseModel):
    reply: ChatMessage
    rag_context: list[RagChunk] = []
    trace: AgentTrace | None = None
