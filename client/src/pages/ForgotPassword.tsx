import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../shared/components/ui/Button'
import { useAuthStore } from '../shared/store/authStore'

export function ForgotPassword() {
  const { requestPasswordReset, isAuthenticating, error, clearError } = useAuthStore()

  // Form state
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Basic validation
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      return
    }

    try {
      // Call auth store action
      await requestPasswordReset(trimmedEmail)

      // Success! Show success message
      setEmailSent(true)
    } catch (error) {
      // Error already handled by store (sets error state, shows toast)
      console.error('Password reset request failed:', error)
    }
  }

  /**
   * Clear error when user starts typing
   */
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (error) clearError()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Sign In Link */}
        <div className="mb-6 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Sign In
          </Link>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-600">
                  Enter your email address and we&apos;ll send you a link to reset your password
                </p>
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    required
                    disabled={isAuthenticating}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isAuthenticating}
                  loadingText="Sending..."
                  disabled={isAuthenticating || !email.trim()}
                  className="w-full"
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                {/* Success Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-4">
                  We sent a password reset link to{' '}
                  <strong className="text-gray-900">{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Click the link in the email to reset your password. The link will expire in 1
                  hour.
                </p>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800 font-medium mb-2">Next steps:</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the reset link in the email</li>
                    <li>Enter your new password</li>
                  </ol>
                </div>

                {/* Dev Note - Inbucket */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-xs text-yellow-800">
                    <strong>Dev Mode:</strong> Check emails at{' '}
                    <a
                      href="http://localhost:8025"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-900"
                    >
                      localhost:8025
                    </a>
                  </p>
                </div>

                {/* Back to Sign In */}
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
