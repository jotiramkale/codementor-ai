/**
 * dashboardMockData.js
 *
 * Realistic-looking mock data for the Phase 4 Dashboard. None of this
 * is read from a real account or database — Phase 19+/20 replaces it
 * with real PostgreSQL-backed data once the backend exists. Kept in one
 * file so it's obvious at a glance what's fabricated versus real.
 */

export const MOCK_STATS = {
  problemsSolved: 47,
  totalProblems: 320,
  accuracy: 68, // percent of submissions that passed
  currentStreak: 5, // days
  averageSolvingTime: '18m 40s',
  totalSubmissions: 112,
}

export const MOCK_DIFFICULTY_PROGRESS = [
  { difficulty: 'Easy', solved: 28, total: 120 },
  { difficulty: 'Medium', solved: 16, total: 150 },
  { difficulty: 'Hard', solved: 3, total: 50 },
]

export const MOCK_RECENT_ACTIVITY = [
  { id: 1, problem: 'Two Sum', difficulty: 'Easy', status: 'Solved', when: '2 hours ago' },
  {
    id: 2,
    problem: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    status: 'Attempted',
    when: 'Yesterday',
  },
  { id: 3, problem: 'Merge Intervals', difficulty: 'Medium', status: 'Solved', when: '2 days ago' },
  { id: 4, problem: 'Binary Tree Level Order Traversal', difficulty: 'Medium', status: 'Solved', when: '3 days ago' },
  { id: 5, problem: 'Valid Parentheses', difficulty: 'Easy', status: 'Solved', when: '4 days ago' },
]

export const MOCK_RECOMMENDED_PROBLEMS = [
  {
    id: 1,
    title: 'Course Schedule',
    difficulty: 'Medium',
    reason: 'Builds on your recent BFS/DFS practice',
  },
  {
    id: 2,
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    reason: 'Sorting is a weak topic for you right now',
  },
  {
    id: 3,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    reason: 'Good entry point into Dynamic Programming patterns',
  },
]

export const MOCK_WEAK_TOPICS = [
  { topic: 'Dynamic Programming', accuracy: 42 },
  { topic: 'Sorting', accuracy: 50 },
  { topic: 'Graphs', accuracy: 58 },
]

export const MOCK_AI_DAILY_PLAN = {
  summary: "Focus on one Dynamic Programming problem and review yesterday's Sorting attempt.",
  steps: [
    'Solve "Climbing Stairs" to warm up on DP',
    'Revisit "Kth Largest Element" — you stopped at the brute-force approach',
    'Read the AI Mentor note on time complexity for common sorting algorithms',
  ],
}

export const MOCK_RECENT_AI_FEEDBACK = [
  {
    id: 1,
    problem: 'Merge Intervals',
    note: 'Correct, but sorting could be avoided with a different approach — see suggestion.',
  },
  {
    id: 2,
    problem: 'Binary Tree Level Order Traversal',
    note: 'Clean BFS implementation. Minor: variable names could be more descriptive.',
  },
]
