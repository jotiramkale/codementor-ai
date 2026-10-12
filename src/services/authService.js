import { apiRequest, clearAccessToken, getAccessToken, setAccessToken } from './apiClient.js'

const SESSION_KEY = 'codementor_user_session'

function saveUser(user) {
  const session = { id: user.id, name: user.name, email: user.email, role: user.role }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

async function saveTokenResponse(result) {
  setAccessToken(result.access_token)
  return saveUser(result.user)
}

export async function signIn({ email, password }) {
  const result = await apiRequest('/api/auth/signin', { method: 'POST', body: { email, password } })
  return saveTokenResponse(result)
}

export async function signUp({ name, email, password }) {
  const result = await apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password } })
  return saveTokenResponse(result)
}

export async function restoreSession() {
  if (!getAccessToken()) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  try {
    return saveUser(await apiRequest('/api/auth/me'))
  } catch (error) {
    signOut()
    throw error
  }
}

export function signOut() {
  clearAccessToken()
  localStorage.removeItem(SESSION_KEY)
}

export function getStoredSession() {
  if (!getAccessToken()) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function requestPasswordReset() {
  throw new Error('Password reset is not available yet. Contact the administrator for account recovery.')
}

export async function resetPassword() {
  throw new Error('Password reset is not available yet. This application has no reset-token backend flow.')
}
