/**
 * Spinner - Universal loading indicator
 *
 * @example
 * // Basic usage
 * <Spinner />
 *
 * @example
 * // Different sizes
 * <Spinner size="sm" />
 * <Spinner size="xl" />
 *
 * @example
 * // Different colors
 * <Spinner color="white" />
 * <Spinner color="gray" />
 *
 * @example
 * // With accessibility label
 * <Spinner label="Loading destinations..." />
 */

interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant */
  color?: 'primary' | 'white' | 'gray'
  /** Additional CSS classes */
  className?: string
  /** Accessibility label for screen readers */
  label?: string
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Loading',
}: SpinnerProps) {
  // Size mapping (width/height)
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  // Color mapping
  const colors = {
    primary: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400',
  }

  return (
    <div role="status" className={className}>
      <svg
        className={`animate-spin ${sizes[size]} ${colors[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
