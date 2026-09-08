/**
 * communityStats.js
 *
 * Fabricated "community" solving-time stats, deterministic per problem
 * (seeded by problem.id) so they stay stable across re-renders instead
 * of flickering every time the solving timer ticks. There is no real
 * community of other solvers behind these numbers — Phase 19+/20
 * replaces this with real aggregated, privacy-safe submission data.
 * No individual user's time or identity is ever shown, only the
 * aggregate median/average/percentile.
 *
 * "Average" here is synthesized to already look like a robust,
 * outlier-trimmed average (a modest multiplier on the median) rather
 * than simulating a full raw distribution and filtering it — there's
 * no raw dataset yet to filter. When Phase 19+/20 computes this for
 * real, the average should exclude extreme outliers (e.g. a trimmed
 * mean) so a few very slow or abandoned attempts don't skew it — the
 * median is the primary comparison shown to the user for that reason.
 */

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function parseEstimatedMinutes(estimatedTime) {
  const match = /(\d+)/.exec(estimatedTime || '')
  return match ? Number(match[1]) : 20
}

export function communityStatsForProblem(problem) {
  const baseSeconds = parseEstimatedMinutes(problem.estimatedTime) * 60
  const r1 = seededRandom(problem.id * 7.13)
  const r2 = seededRandom(problem.id * 3.71 + 1)
  const medianSeconds = Math.round(baseSeconds * (0.85 + r1 * 0.3))
  const averageSeconds = Math.round(medianSeconds * (1.15 + r2 * 0.25))
  return { medianSeconds, averageSeconds }
}

/**
 * Illustrative heuristic only — not derived from any real distribution.
 * Faster than the median maps above the 50th percentile, scaled by how
 * much faster/slower, and clamped to a believable 1-99 range.
 */
export function estimatePercentile(yourSeconds, medianSeconds) {
  const ratio = medianSeconds / Math.max(yourSeconds, 1)
  return Math.min(99, Math.max(1, Math.round(50 * ratio)))
}
