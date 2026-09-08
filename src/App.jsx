import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppShell from './layouts/AppShell.jsx'
import SignIn from './pages/auth/SignIn.jsx'
import SignUp from './pages/auth/SignUp.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Problems from './pages/Problems.jsx'
import ProblemDetail from './pages/ProblemDetail.jsx'
import Practice from './pages/Practice.jsx'
import AiMentor from './pages/AiMentor.jsx'
import Interview from './pages/Interview.jsx'
import ProgressPage from './pages/Progress.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — signed-out visitors land here */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected — everything inside the app shell requires (mock) auth */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/ai-mentor" element={<AiMentor />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
