import type { ApiError } from '../shared/types/auth'

/**
 * API Configuration
 */

// API base URL from environment variable
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  statusCode?: number
  code?: string

  constructor(message: string, statusCode?: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * Type-safe fetch wrapper for API calls
 *
 * @example
 * const user = await fetchAPI<User>('/api/users/me')
 *
 * @example
 * await fetchAPI('/api/auth/sign-out', { method: 'POST' })
 *
 * @example
 * const data = await fetchAPI<SessionResponse>('/api/auth/get-session')
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Default options
  const config: RequestInit = {
    credentials: 'include', // Important: Include cookies for sessions
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    // Handle non-JSON responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    // Parse response body
    const data = await response.json()

    // Handle error responses
    if (!response.ok) {
      const error = data as ApiError
      throw new ApiRequestError(
        error.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        error.code
      )
    }

    return data as T
  } catch (error) {
    // Network errors (server down, no internet, etc.)
    if (error instanceof TypeError) {
      throw new ApiRequestError('Unable to connect to server. Please check your connection.')
    }

    // Re-throw API errors
    if (error instanceof ApiRequestError) {
      throw error
    }

    // Unknown errors
    throw new ApiRequestError('An unexpected error occurred')
  }
}
