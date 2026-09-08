/**
 * analyticsService.js
 * Not used yet — scaffolded ahead of Phase 9 (solving-time analytics)
 * and Phase 16 (learning progress). Will compute community medians and
 * per-user progress without exposing other users' identities.
 */

export async function getSolvingTimeStats(/* problemId */) {
  return { yourTime: null, communityMedian: null, communityAverage: null, percentile: null }
}

export async function getProgressSummary(/* userId */) {
  return { solvedCount: 0, accuracy: null, streak: 0, topicMastery: [] }
}
