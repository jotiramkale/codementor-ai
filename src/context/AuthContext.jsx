import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredSession())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    authService.restoreSession()
      .then((restored) => { if (active) setUser(restored) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setIsLoading(false) })
    const onUnauthorized = () => setUser(null)
    window.addEventListener('codementor:unauthorized', onUnauthorized)
    return () => {
      active = false
      window.removeEventListener('codementor:unauthorized', onUnauthorized)
    }
  }, [])

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
    isLoading,
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
