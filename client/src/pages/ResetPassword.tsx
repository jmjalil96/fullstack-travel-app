import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../shared/components/ui/Button'
import { useToast } from '../shared/hooks/useToast'
import { useAuthStore } from '../shared/store/authStore'

export function ResetPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const { resetPassword, isAuthenticating, error, clearError } = useAuthStore()

  // Extract token from URL
  const token = searchParams.get('token')

  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  /**
   * Validate token on mount
   */
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      toast.error('Invalid reset link')
    } else {
      setTokenValid(true)
    }
  }, [token, toast])

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    const trimmedPassword = password.trim()

    if (!trimmedPassword || !token) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    try {
      // Call auth store action
      await resetPassword(token, trimmedPassword)

      // Success!
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (error) {
      // Error already handled by store (sets error state, shows toast)
      console.error('Password reset failed:', error)
    }
  }

  /**
   * Clear error when user starts typing
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (error) clearError()
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (error) clearError()
  }

  // Check if passwords match
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const showMatchError = confirmPassword && password !== confirmPassword

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>

            <div className="space-y-3">
              <Link to="/forgot-password">
                <Button variant="primary" className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Sign In Link */}
        <div className="mb-6 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Sign In
          </Link>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => handlePasswordChange(e.target.value)}
                required
                minLength={8}
                disabled={isAuthenticating}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => handleConfirmPasswordChange(e.target.value)}
                required
                minLength={8}
                disabled={isAuthenticating}
                placeholder="Re-enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              {/* Password Match Indicator */}
              {showMatchError && (
                <p className="mt-1 text-xs text-red-600">✗ Passwords do not match</p>
              )}
              {passwordsMatch && <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isAuthenticating}
              loadingText="Resetting password..."
              disabled={
                isAuthenticating ||
                !password.trim() ||
                !confirmPassword.trim() ||
                password !== confirmPassword ||
                password.length < 8
              }
              className="w-full"
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
