import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import { resetPassword } from '../../services/authService.js'

// No real reset-token system exists yet (Phase 19+/24), so this screen
// is reachable directly for now rather than gated behind an email link.
function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword({ newPassword: password })
      setIsDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isDone) {
    return (
      <AuthLayout title="Password reset" subtitle="Mock only — no real password was changed.">
        <Button onClick={() => navigate('/sign-in')} className="w-full">
          Back to sign in
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Mock screen — reachable without a real reset link for now.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-400"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-zinc-300">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-400"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        <Link to="/sign-in" className="text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ResetPassword
