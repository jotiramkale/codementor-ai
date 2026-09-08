import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Wraps the main app routes (everything inside AppShell). This is
// frontend-only gating — a real backend still has to enforce access
// itself once it exists (Phase 19+); this only controls what the
// browser renders.
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
