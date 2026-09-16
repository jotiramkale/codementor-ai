"""
app/execution — not implemented yet.

The real Docker sandbox: timeout, memory limit, CPU limit, restricted
filesystem, network restrictions, process isolation, cleanup, and a
maximum output size — per the original spec's "Code Execution
Security" section. This replaces submissionService.js's mock
Math.random()-based pass/fail simulation (Phase 8) with an engine that
actually compiles/runs untrusted code against real test_cases rows
(see app/models/test_case.py) and returns a genuine result. Treat
user-submitted code as untrusted, always. Planned for Phase 21.
"""
