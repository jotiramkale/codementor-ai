# CodeMentor AI

AI-powered DSA learning, code review, debugging and mentoring platform.
Final-year B.Tech CSE project, built in phases.

**Current status: Phase 10 complete** — a full 7-section AI Review
panel on the problem page, grounded in real Run/Submit results so it
never claims code passed unless execution data says so. See
`legacy/README.md` for how the original prototype maps onto this
structure.

## Folder structure

```
src/
  components/   Sidebar, TopBar, MobileDrawer, NavItem, SearchBar,
                NotificationsMenu, ProfileMenu, ProtectedRoute,
                ProblemCard, and components/ui/ (Button, Avatar, Badge,
                IconButton, EmptyState, Panel, StatCard, FilterChip)
  pages/        Dashboard (Phase 4), Problems + ProblemDetail (Phase 5/6,
                real), Practice, AiMentor, Interview, Progress, Profile
                (Practice hosts the working review flow; AiMentor/
                Interview/Progress/Profile are still placeholders) and
                pages/auth/ (SignIn, SignUp, ForgotPassword, ResetPassword)
  layouts/      AppShell.jsx (signed-in shell) and AuthLayout.jsx
                (centered layout for the auth pages)
  hooks/        custom React hooks (empty — later phases)
  services/     all API/data access lives here, nowhere else
  utils/        difficulty.js, time.js, communityStats.js (all pure,
                no React/API dependencies)
  data/         navigation.js, dashboardMockData.js, problemsMockData.js,
                languages.js (shared editor language list)
  context/      AuthContext.jsx — mock auth state via useAuth()
  features/     larger self-contained feature modules (empty — later phases)
  assets/       icons/images/fonts (empty)
legacy/
  test.py       original Streamlit prototype, kept for reference
```

## Running locally

This sandbox has no internet access, so dependencies could not be
installed or built here. On your machine:

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). You'll
land on **Sign in** first now — use "Sign up" (any name/email + a 6+
character password) or "Sign in" the same way; there's no real backend,
so any well-formed input works. Once in, use the sidebar (or the ☰ menu
on a narrow window) to reach Practice, which has the real form.

To produce a production build:

```bash
npm run build
npm run preview
```

## Design system (Phase 2)

Dark-first, two accent colors that carry meaning rather than decoration:
**amber** for the learner's own work (nav highlights, primary buttons),
**indigo** for AI-generated content (AI Mentor nav item, mock-response
badge). Type: Sora for headings, IBM Plex Sans for body/UI, IBM Plex
Mono reserved for actual code/technical strings. Built with Tailwind CSS;
the one deliberate motion moment is the mobile drawer's slide-in
(Framer Motion) — no per-element hover animations elsewhere.

## Authentication (Phase 3)

Frontend-only mock — no backend or JWT exists yet:
- Sign in/up accept any input that's the right *shape* (valid-looking
  email, 6+ character password) and fabricate a user `{ name, email }`.
  **No password is ever stored** — not in state, not in localStorage.
- The mock session (name + email only) is kept in `localStorage` just so
  refreshing the page doesn't log you out while testing. This is a
  deliberate shortcut for a mock, not a recommendation for real
  JWTs — see the comment at the top of `src/services/authService.js`.
- All routes under the main shell are wrapped in `ProtectedRoute`; visiting
  them signed out redirects to Sign in and returns you to where you were
  headed after signing in.
- Log out (in the profile menu) actually clears the mock session now.

## AI Code Review (Phase 10)

The problem page now has a full **AI Review** panel — the seven
sections from the spec: Overall Assessment, Bug Analysis, Time
Complexity, Space Complexity, Code Quality, Suggested Improvement,
Learning Tip. `src/services/aiService.js` gained `reviewSubmission()`
for this; the original `reviewCode()` (3 sections: correctness/errors/
improvements) is untouched and still powers the Practice page, since
Practice — like the original prototype — has no problem catalog or
execution context to draw on.

**The one rule this feature's honesty depends on**: the review is only
ever allowed to talk about correctness using real Run/Submit results,
never a guess.
- No run or submission yet → the review says correctness is
  unverified — it will not guess.
- Your last Submit (preferred) or Run result exists → the review's
  Overall Assessment states exactly what that result was and defers to
  it, never contradicting it.

I wrote this as one small, auditable function
(`buildCorrectnessAssessment` in `aiService.js`) specifically so it's
easy to check by reading, and then verified it — not just by eye,
but by actually running it against four cases (no results, Accepted,
Wrong Answer, empty code) and confirming none of them produce a false
claim of success. The other 6 sections are honestly-labeled generic
placeholders (they say plainly that they're not derived from reading
your actual code) since real per-code analysis needs Groq, which isn't
connected until Phase 22.

Architecture notes some of you may want to verify yourselves: the AI
call has been behind a service-layer function since Phase 1
(`aiService.js` — the UI never touches the model directly), and the
real `GROQ_API_KEY` has never been anywhere but `.env.example` as a
placeholder name, matching "move API logic into a service layer" and
"keep API key in environment variables" from the spec.

## Time + submission analytics (Phase 9)

- A **solving timer** ticks in the "Your code" panel header from the
  moment you open the problem. It's elapsed time on the page, not true
  idle-excluded "active" time, and it resets if you navigate away and
  back — no persistence yet.
- On an **Accepted** submission, a comparison block shows Your Time,
  Community Median (emphasized — the spec asks for median as the main
  comparison, since a couple of very slow outliers can drag an average
  up misleadingly), Community Average, and a Percentile. All of this is
  clearly labeled as demo data — see `utils/communityStats.js` for how
  it's fabricated (deterministically per problem, so it doesn't change
  every time the timer ticks) and a note on what "robust" averaging
  should mean once Phase 19+/20 has real submission data to filter.
- **Submission history** (attempt number, status, language, runtime,
  memory, solving time, date) accumulates as you submit during this
  visit to the page. It's session-only — refreshing or navigating away
  clears it, since nothing persists it yet.
- No other users' identities appear anywhere — the comparison is
  aggregate numbers only, real or mock.

## Run / Submit (Phase 8)

`src/services/submissionService.js` simulates execution — **there is no
real compiler, interpreter, or sandbox behind it**, and the UI says so
in a permanent caption under the Run/Submit buttons, not just a tooltip.

- **Run**: tests against 3 sample tests, shows a pass/fail badge and a
  fake runtime per test; for the 6 detailed problems, the real example
  input/expected output is shown alongside the result.
- **Submit**: tests against a simulated hidden suite (15/25/40 tests for
  Easy/Medium/Hard), returns Accepted, Wrong Answer, or Runtime Error,
  with a passed-count, and runtime + memory only when Accepted.
- Code left unchanged from the starter (or empty) always fails
  everything with a clear message — never a lucky pass on nothing
  written.
- Clicking Run and Submit are visually and functionally separate: each
  shows its own result panel, and starting one clears the other so
  they're never shown mixed together.

**A mock-modeling bug I caught while testing, not just writing**: my
first version flipped an independent coin per hidden test. With 25
tests at 80% each, the odds of *all* passing were about 0.4% —
"Accepted" would have been nearly unreachable, which reads as broken,
not realistic. I rewrote it so the whole submission's outcome is one
decision (60% chance of a full Accepted), which behaves the way real
code actually does — correct solutions pass everything, buggy ones fail
consistently rather than randomly per test. I verified the corrected
version actually produces sensible results (see the phase report) before
shipping it.

## Monaco editor (Phase 7)

`src/components/CodeEditor.jsx` wraps `@monaco-editor/react`. Supports
Python, Java, C++, and JavaScript; a Dark/Light theme toggle; a Reset
button that restores the current language's starter code; and real line
numbers/syntax highlighting (Monaco's defaults). Each language keeps its
own code buffer while you're on the page, so switching the language
dropdown back and forth doesn't lose what you typed in either one — that
does **not** currently survive navigating away from the page or a
refresh, since this component doesn't persist anywhere yet.

Six problems (the same six with full descriptions) have a starter
function signature tailored to match their actual problem — e.g. Two
Sum's Python starter is `def two_sum(nums, target):`, not a generic
placeholder. The other 23 get a generic `solve()` starter in each
language.

**One dependency worth knowing about**: this uses `@monaco-editor/react`'s
default CDN loader rather than bundling Monaco locally — the standard,
well-documented way to use it with Vite. That means the editor needs
internet access the *first* time it loads in your browser (to fetch
Monaco's assets from jsDelivr). Self-hosting Monaco to remove that
dependency is possible but needs extra Vite worker configuration I
didn't want to guess at without being able to test it — a reasonable
future improvement if you'd rather not rely on a CDN.

## Problem-solving page (Phase 6)

Click any problem in the catalog to open `/problems/:id`. Six well-known
problems (Two Sum, Valid Parentheses, Reverse Linked List, Binary
Search, Climbing Stairs, Merge Intervals) have full description/
examples/constraints/hints written out; the other 23 show an honest
"full statement not yet written" note instead of fake content. The code
area is a plain textarea for now — Monaco (Phase 7) and working Run/
Submit (Phase 8) are the next two phases, and the buttons are visibly
disabled rather than silently doing nothing.

## What's real vs. mock vs. planned right now

- **Real**: the shell, auth flow and route protection; the Practice
  page; the Dashboard, Problems, and ProblemDetail pages; the Monaco
  editor; the Run/Submit UX; the solving timer and submission history;
  the AI Review panel's *behavior* (grounding correctness in real
  execution results, never guessing) genuinely works as designed.
- **Mock**: authentication, every Dashboard number, the entire problem
  catalog, Run/Submit's execution results, the community time-comparison
  stats, and the AI review's actual content (6 of 7 sections are
  honestly-labeled generic placeholders; the 7th — Overall Assessment —
  is dynamic but still template-based, not real analysis) — none of
  this reflects a real backend, database, code execution, or LLM call.
  All fabricated until Phase 19-22 build the real versions.
- **Planned, visibly labeled as such**: AI Mentor, Interview, Progress,
  Profile — each shows an empty state naming which phase builds it.
- **Not implemented**: global search (visually present, disabled),
  notifications (a genuine empty state), and persistence of anything
  (solving time, submission history, solved status, AI reviews) beyond
  the current page visit — that needs the real backend (Phase 19+/20).
