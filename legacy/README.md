# Original prototype (reference only)

`test.py` is the original Streamlit + Groq AI code reviewer this project
started from. It's kept here for reference and grading history — it is
**not** part of the running app anymore.

What was carried forward into the new architecture, and where:

| Original piece                                   | Now lives in                          |
|---------------------------------------------------|----------------------------------------|
| Problem statement + code input form                | `src/pages/CodeReview.jsx`             |
| "Correct / errors / improvements" review prompt    | `src/services/aiService.js` (`buildReviewPrompt`) |
| Groq API call                                      | Will move to the FastAPI backend (Phase 19+/22) — never called directly from the browser |
| `GROQ_API_KEY` handling                            | Will move to backend `.env` — see root `.env.example` |

Nothing here is deleted permanently; it's just no longer the live UI.
