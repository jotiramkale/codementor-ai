/**
 * progressMockData.js
 *
 * Phase 16: fabricated analytics data for the Progress page. Shaped so
 * a real backend can fill the same structure later — topic mastery as
 * an array of { topic, mastery }, a weekly trend as an array of
 * { week, minutes }, etc. — rather than a shape invented here that a
 * real API would need to be redesigned around.
 *
 * Numbers are kept consistent with Dashboard's mock data
 * (dashboardMockData.js) where they overlap — same problems-solved,
 * accuracy, streak, and weak topics — so the two pages don't quietly
 * contradict each other, same idea as the Heaps/Sorting fix in Phase 5.
 */

export const MOCK_PROGRESS_STATS = {
  problemsSolved: 47,
  accuracy: 68,
  totalAttempts: 112,
  currentStreak: 5,
}

export const MOCK_DIFFICULTY_DISTRIBUTION = [
  { difficulty: 'Easy', solved: 28 },
  { difficulty: 'Medium', solved: 16 },
  { difficulty: 'Hard', solved: 3 },
]

export const MOCK_SOLVING_TIME_TREND = [
  { week: 'Wk 1', minutes: 32 },
  { week: 'Wk 2', minutes: 29 },
  { week: 'Wk 3', minutes: 27 },
  { week: 'Wk 4', minutes: 25 },
  { week: 'Wk 5', minutes: 24 },
  { week: 'Wk 6', minutes: 22 },
  { week: 'Wk 7', minutes: 20 },
  { week: 'Wk 8', minutes: 18.7 },
]

// Matches the 14-topic taxonomy from problemsMockData.js (Phase 5) so
// this never introduces a topic name the rest of the app doesn't use.
// Sorted ascending on purpose — the lowest 3 (Dynamic Programming,
// Sorting, Graphs) match Dashboard's weak topics exactly.
export const MOCK_TOPIC_MASTERY = [
  { topic: 'Dynamic Programming', mastery: 42 },
  { topic: 'Sorting', mastery: 50 },
  { topic: 'Graphs', mastery: 58 },
  { topic: 'Recursion', mastery: 60 },
  { topic: 'Backtracking', mastery: 63 },
  { topic: 'Queue', mastery: 65 },
  { topic: 'Trees', mastery: 68 },
  { topic: 'Linked List', mastery: 70 },
  { topic: 'Hashing', mastery: 71 },
  { topic: 'Strings', mastery: 74 },
  { topic: 'Stack', mastery: 76 },
  { topic: 'Searching', mastery: 80 },
  { topic: 'Arrays', mastery: 82 },
  { topic: 'Greedy', mastery: 85 },
]

export const MOCK_RECENT_IMPROVEMENTS = [
  'Average solving time is down from 32m to about 19m over the last 8 weeks.',
  'Searching problems are now your strongest topic at 80% mastery.',
  'Solved 3 Medium problems in a row without a Wrong Answer submission.',
]

export const MOCK_AI_RECOMMENDATIONS = [
  'Spend this week on Dynamic Programming — it is your lowest-mastery topic right now.',
  'Review Sorting fundamentals before your next Graphs problem; several graph algorithms lean on sorting.',
  'Try one Graphs problem this week to build consistency rather than avoiding the topic.',
]
