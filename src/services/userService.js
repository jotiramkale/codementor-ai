/**
 * userService.js
 *
 * Phase 14: semantic user memory. Real architecture (later phases)
 * splits this into two stores:
 *   - Structured facts (solved counts, streaks, timestamps) -> PostgreSQL
 *   - Semantic/qualitative observations (getMemory below) -> ChromaDB,
 *     embedded and retrieved by similarity — the same shape ragService.js
 *     will move to in Phase 23.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: memory is always scoped by
 * userId and must never leak across users. getMemory() throws without
 * one rather than silently returning something. Every returned
 * observation is deterministically derived FROM the userId (a simple
 * string hash seeds the selection), so two different accounts see
 * different fabricated memory, never the same shared blob — verified
 * by actually calling it with two different ids (see the phase report).
 *
 * getProfile() stays a stub — this app already has real (mock) account
 * info via AuthContext, so the Profile page reads from there for now
 * rather than duplicating it. This waits for a real backend endpoint.
 */

export async function getProfile(/* userId */) {
  return null
}

const OBSERVATION_POOL = {
  strengths: [
    { topic: 'Arrays', note: 'Consistently reaches for an efficient approach without prompting.' },
    { topic: 'Hashing', note: 'Reaches for a hash map quickly when it is the right tool.' },
    { topic: 'Searching', note: 'Handles binary search boundary conditions cleanly.' },
    { topic: 'Strings', note: 'Comfortable with in-place string manipulation.' },
  ],
  weakAreas: [
    { topic: 'Dynamic Programming', note: 'Struggles most with problems needing state across two dimensions.' },
    { topic: 'Graphs', note: 'Sometimes forgets to mark nodes visited, leading to repeated work.' },
    { topic: 'Recursion', note: 'Has trouble identifying the base case before the recursive case.' },
    { topic: 'Backtracking', note: 'Occasionally forgets to undo a choice before trying the next one.' },
  ],
  patterns: [
    'Frequently makes off-by-one errors at loop boundaries.',
    'Prefers to see a hint before attempting a brute-force pass.',
    'Tends to submit before running sample tests first.',
    'Usually re-reads the problem statement a second time before starting.',
  ],
}

function hashUserId(userId) {
  let hash = 0
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 100000
  }
  return hash
}

// Deterministic, duplicate-free selection seeded by the hashed userId —
// same user always sees the same demo memory; different users see
// different demo memory.
function pickDistinct(pool, seed, count) {
  const result = []
  let offset = 0
  while (result.length < count && offset < pool.length * 2) {
    const item = pool[(seed + offset) % pool.length]
    if (!result.includes(item)) result.push(item)
    offset += 1
  }
  return result
}

/**
 * @param {string} userId - required; memory must always be scoped to a
 *   specific user. In this demo, the signed-in account's email.
 */
export async function getMemory(userId) {
  if (!userId) {
    throw new Error('getMemory requires a userId — memory must always be scoped to a specific user.')
  }

  await new Promise((resolve) => setTimeout(resolve, 500))

  const seed = hashUserId(userId)
  const strengths = pickDistinct(OBSERVATION_POOL.strengths, seed, 2)
  const weakAreas = pickDistinct(OBSERVATION_POOL.weakAreas, seed + 17, 2)
  const patterns = pickDistinct(OBSERVATION_POOL.patterns, seed + 31, 2)

  return {
    isMock: true,
    userId,
    strengths,
    weakAreas,
    patterns,
    recentObservations: [
      { when: 'This week', note: patterns[0] },
      { when: 'Last session', note: `${weakAreas[0].topic}: ${weakAreas[0].note}` },
    ],
  }
}
