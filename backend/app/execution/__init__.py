"""Real, isolated code execution used by the submission API (Phase 21).

The API process only talks to Docker; submitted source is compiled and run
inside disposable, resource-limited containers. There is deliberately no
local-process fallback.
"""
