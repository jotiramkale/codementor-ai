/**
 * authService.js
 *
 * Phase 3: frontend-only mock authentication. No backend or JWT exists
 * yet (that's Phase 19+/24) — this simulates the shape of real auth so
 * the UI, routing, and AuthContext can be built against a stable
 * contract now and reconnected to the real thing later.
 *
 * A mock session (name + email only — NEVER a password) is kept in
 * localStorage purely so you aren't logged out on every page refresh
 * while testing. This is a deliberate shortcut for a mock, not a
 * recommendation for real JWTs: a real token is safer in an httpOnly
 * cookie than in localStorage, where any script on the page can read
 * it. Revisit this choice explicitly when Phase 19+/24 wires up the
 * real backend.
 */

const SESSION_KEY = 'codementor_mock_session'
const MOCK_DELAY_MS = 500

function delay(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function signIn({ email, password }) {
  await delay()

  if (!email || !password) {
    throw new Error('Email and password are required.')
  }
  if (password.length < 6) {
    // No real backend to check against yet — this only checks shape,
    // not a real credential.
    throw new Error('Incorrect email or password.')
  }

  const user = { name: email.split('@')[0], email }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function signUp({ name, email, password }) {
  await delay()

  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.')
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  const user = { name, email }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function requestPasswordReset({ email }) {
  await delay()
  // Real implementation sends an email via the backend (Phase 19+/24).
  // Nothing is actually sent here.
  return { status: 'mock_sent', email }
}

export async function resetPassword({ newPassword }) {
  await delay()
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }
  // No real token system exists yet — this accepts any request.
  return { status: 'mock_reset' }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
