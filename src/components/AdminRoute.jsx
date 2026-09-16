import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Phase 18: separate from ProtectedRoute on purpose — being signed in
// and being an admin are different checks. A signed-in student hitting
// an admin URL directly gets redirected to Dashboard, not shown the
// admin UI and not just hidden a nav link that would still be
// reachable by URL.
function AdminRoute({ children }) {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
