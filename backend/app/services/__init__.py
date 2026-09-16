"""
app/services — not implemented yet.

Business logic that route handlers in app/api/ will delegate to once
there's enough of it to be worth separating from the route functions
themselves (right now app/api/auth.py and problems.py hold their own
logic directly, which is fine at this size). Expected to grow starting
around Phase 21 (execution results need real post-processing) and
Phase 22 (assembling prompts from problem + submission + test data
before calling Groq).
"""
