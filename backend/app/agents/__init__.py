"""
app/agents — not implemented yet.

The backend home for the 9 agents and orchestrator the frontend already
implemented as a real (mocked) architecture in agentService.js (Phase
15): Code Review, Debug, Hint, Complexity, Learning Coach, Interview,
Problem Generator, Analytics, and Reflection/Critic agents, routed by
an orchestrator. That frontend file is the reference implementation for
the routing logic and the honesty rules (never fabricate an answer for
an agent that isn't built, always let the critic re-check test-result
claims) — porting it here field-for-field, backed by real Groq calls
per agent, is the plan once Phase 22 lands.
"""
