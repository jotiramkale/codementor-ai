import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import { requestPasswordReset } from '../../services/authService.js'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    await requestPasswordReset({ email })
    setIsLoading(false)
    setIsSent(true)
  }

  if (isSent) {
    return (
      <AuthLayout title="Check your email" subtitle="Mock only — no email was actually sent (no backend yet).">
        <p className="text-sm text-zinc-400">
          In the real version (Phase 19+/24), a reset link would arrive at{' '}
          <span className="text-zinc-200">{email}</span>.
        </p>
        <Link to="/reset-password" className="mt-4 block text-center text-sm text-indigo-400 hover:text-indigo-300">
          Preview the reset-password screen →
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send a reset link.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-400"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Sending…' : 'Send reset link'}
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

export default ForgotPassword
