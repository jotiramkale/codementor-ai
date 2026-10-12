"""
app/schemas — Pydantic request/response models. These are the "API
contracts" Phase 19 asks for: shapes matched field-for-field against
what the frontend's mock services (aiService.js, submissionService.js,
etc.) already send and expect, so swapping mock for real doesn't
require frontend changes beyond flipping USE_MOCK flags.
"""
