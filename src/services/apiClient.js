const TOKEN_KEY = 'codementor_access_token'
const configuredApiBase = import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = (configuredApiBase === undefined ? 'http://127.0.0.1:8000' : configuredApiBase).replace(/\/$/, '')

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, ...options } = {}) {
  const token = getAccessToken()
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error(`Cannot access the CodeMentor backend at ${API_BASE_URL}. Check FastAPI is running, VITE_API_BASE_URL is correct, and the page origin is allowed by backend CORS.`)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  let payload
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json()
    } catch {
      payload = { detail: 'The server returned an invalid JSON response.' }
    }
  } else {
    payload = await response.text()
  }
  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new Event('codementor:unauthorized'))
    }
    const detail = typeof payload === 'object' ? payload?.detail : payload
    const error = new Error(Array.isArray(detail) ? detail.map((issue) => issue.msg).join(', ') : detail || `Request failed (${response.status}).`)
    error.status = response.status
    error.requestId = response.headers.get('x-request-id') || undefined
    throw error
  }
  return payload
}
