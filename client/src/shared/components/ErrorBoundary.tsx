/* eslint-disable react-refresh/only-export-components */
import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Custom fallback UI (component or render function) */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Custom error handler for logging to external services */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Array of values that trigger a reset when they change */
  resetKeys?: unknown[]
}

/**
 * Internal state for the ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 *
 * @example
 * // Wrap entire app
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // Wrap specific routes (when using router)
 * <ErrorBoundary resetKeys={[pathname]}>
 *   <YourPage />
 * </ErrorBoundary>
 *
 * @example
 * // Custom fallback UI
 * <ErrorBoundary fallback={<YourCustomErrorUI />}>
 *   <ComplexFeature />
 * </ErrorBoundary>
 *
 * @example
 * // With error logging
 * <ErrorBoundary onError={(error) => logToSentry(error)}>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error details when caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Always log to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    // Store error info in state
    this.setState({ errorInfo })

    // Call custom error handler if provided (e.g., for Sentry)
    this.props.onError?.(error, errorInfo)
  }

  /**
   * Auto-reset when resetKeys change (e.g., route changes)
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props
    const { hasError } = this.state

    // If we have reset keys and error state, check if keys changed
    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys
      const hasResetKeysChanged =
        !prevResetKeys ||
        resetKeys.length !== prevResetKeys.length ||
        resetKeys.some((key, index) => key !== prevResetKeys[index])

      if (hasResetKeysChanged) {
        this.reset()
      }
    }
  }

  /**
   * Reset error state (manual or automatic)
   */
  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' ? fallback(error, this.reset) : fallback
      }

      // Otherwise use default fallback
      return <ErrorFallback error={error} errorInfo={this.state.errorInfo} reset={this.reset} />
    }

    return children
  }
}

/**
 * Default fallback UI shown when an error occurs
 */
interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo | null
  reset: () => void
}

function ErrorFallback({ error, errorInfo, reset }: ErrorFallbackProps): ReactNode {
  const isDev = import.meta.env.DEV

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Something went wrong</h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          We&apos;re sorry for the inconvenience. An unexpected error occurred while loading this
          page.
        </p>

        {/* Actions */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>

        {/* Dev mode error details */}
        {isDev && (
          <details className="mt-6 border-t pt-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-4">
              Error Details (Development Only)
            </summary>

            <div className="space-y-4">
              {/* Error message */}
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                <p className="text-sm text-red-700 font-mono">{error.toString()}</p>
              </div>

              {/* Component stack */}
              {errorInfo?.componentStack && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">Component Stack:</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto font-mono whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {/* Copy error button */}
              <button
                onClick={() => {
                  const errorText = `Error: ${error.toString()}\n\nComponent Stack:${errorInfo?.componentStack || 'N/A'}`
                  navigator.clipboard.writeText(errorText)
                  alert('Error details copied to clipboard!')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Copy error details to clipboard
              </button>
            </div>
          </details>
        )}

        {/* Production hint */}
        {!isDev && (
          <p className="text-xs text-gray-500 text-center mt-6">
            Error ID: {Date.now().toString(36)}-{Math.random().toString(36).substring(2, 9)}
          </p>
        )}
      </div>
    </div>
  )
}
