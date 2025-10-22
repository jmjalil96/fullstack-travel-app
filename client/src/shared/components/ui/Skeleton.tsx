/**
 * Skeleton - Placeholder for loading content
 *
 * @example
 * // Text line placeholders
 * <Skeleton className="h-4 w-full" />
 * <Skeleton className="h-4 w-3/4" />
 * <Skeleton className="h-4 w-1/2" />
 *
 * @example
 * // Avatar placeholder
 * <Skeleton className="h-12 w-12 rounded-full" />
 *
 * @example
 * // Card placeholder
 * <div className="space-y-2">
 *   <Skeleton className="h-6 w-1/3" />
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-2/3" />
 * </div>
 *
 * @example
 * // Without animation
 * <Skeleton className="h-4 w-full" animate={false} />
 */

interface SkeletonProps {
  /** Additional CSS classes for sizing and shaping */
  className?: string
  /** Enable pulse animation (default: true) */
  animate?: boolean
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  const animationClass = animate ? 'animate-pulse' : ''

  return (
    <div
      className={`bg-gray-200 rounded ${animationClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
