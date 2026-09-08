import { createContext, useContext, useState } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

/**
 * Phase 3: mock auth state, shared app-wide. Session is read
 * synchronously from localStorage on first render (no loading flicker
 * before deciding whether to redirect to sign-in). See authService.js
 * for why localStorage is fine for this mock but not the final plan
 * for real JWTs.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredSession())

  async function signIn(credentials) {
    const loggedInUser = await authService.signIn(credentials)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function signUp(details) {
    const newUser = await authService.signUp(details)
    setUser(newUser)
    return newUser
  }

  function signOut() {
    authService.signOut()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
