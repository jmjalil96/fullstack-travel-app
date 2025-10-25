import { env } from '../../../config/env.js'
import { InternalServerError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

// ========== Types ==========

interface TokenCache {
  token: string
  expiresAt: Date
  refreshCookie?: string
}

interface AssistcardLoginResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    token: string
    expiration: string
  }
  type?: string
  title?: string
  status?: number
}

interface AssistcardRefreshResponse {
  traceId: string
  isSuccess: boolean
  data?: {
    token: string
    expiration: string
  }
  errorCode?: string
  errorMessage?: string
}

// ========== Cache ==========

let cachedToken: TokenCache | null = null

// ========== Public API ==========

/**
 * Get a valid Assistcard authentication token
 * - Mock mode: Returns dummy token
 * - Real mode: Returns cached token or fetches new one
 *
 * @returns Valid bearer token for Assistcard API calls
 * @throws InternalServerError if authentication fails
 */
export async function getValidToken(): Promise<string> {
  // Mock mode: return dummy token
  if (env.ASSISTCARD_USE_MOCK) {
    logger.debug('Using mock Assistcard token')
    return 'mock-assistcard-token'
  }

  const now = new Date()

  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > now) {
    logger.debug('Using cached Assistcard token')
    return cachedToken.token
  }

  // Token expired - try refresh first if we have a cookie
  if (cachedToken?.refreshCookie) {
    logger.debug('Token expired, attempting refresh')
    try {
      const { token, expiresAt } = await assistcardRefreshToken()
      // Update cache with new token (keep existing cookie)
      cachedToken = {
        token,
        expiresAt,
        refreshCookie: cachedToken.refreshCookie,
      }
      return token
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Token refresh failed, falling back to full login'
      )
      // Clear cache and fall through to login
      cachedToken = null
    }
  }

  // No cached token or refresh failed - do full login
  logger.info('Fetching new Assistcard token via login')

  const { token, expiresAt, refreshCookie } = await assistcardLogin()

  // Cache token with refresh cookie
  cachedToken = { token, expiresAt, refreshCookie }

  return token
}

/**
 * Clear cached token (useful for testing or forcing re-auth)
 */
export function clearTokenCache(): void {
  cachedToken = null
  logger.debug('Cleared Assistcard token cache')
}

// ========== Internal Functions ==========

/**
 * Authenticate with Assistcard API
 * @returns Token, expiration date (with 5-minute safety margin), and refresh cookie
 */
async function assistcardLogin(): Promise<{
  token: string
  expiresAt: Date
  refreshCookie?: string
}> {
  // Validate required environment variables
  if (!env.ASSISTCARD_API_URL) {
    throw new InternalServerError('ASSISTCARD_API_URL not configured')
  }

  const username = process.env.ASSISTCARD_USERNAME
  const password = process.env.ASSISTCARD_PASSWORD

  if (!username || !password) {
    throw new InternalServerError('ASSISTCARD_USERNAME or ASSISTCARD_PASSWORD not configured')
  }

  try {
    const response = await fetch(`${env.ASSISTCARD_API_URL}/api/Authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify({
        userName: username,
        password: password,
      }),
    })

    const data: AssistcardLoginResponse = await response.json()

    // Check for authentication failure
    if (!response.ok || !data.isSuccess || !data.data) {
      logger.error(
        {
          status: response.status,
          traceId: data.traceId,
          error: data.title || 'Authentication failed',
        },
        'Assistcard login failed'
      )
      throw new InternalServerError(
        `Assistcard authentication failed: ${data.title || 'Unknown error'} (traceId: ${data.traceId})`
      )
    }

    // Calculate expiration with 5-minute safety margin
    const expiresAt = new Date(data.data.expiration)
    const safeExpiresAt = new Date(expiresAt.getTime() - 5 * 60 * 1000)

    // Extract refresh cookie from Set-Cookie header
    const setCookieHeader = response.headers.get('set-cookie')
    const refreshCookie = setCookieHeader?.split(';')[0] // Extract "name=value" only

    logger.info(
      {
        traceId: data.traceId,
        expiresAt: safeExpiresAt.toISOString(),
        hasRefreshCookie: !!refreshCookie,
      },
      'Successfully authenticated with Assistcard'
    )

    return {
      token: data.data.token,
      expiresAt: safeExpiresAt,
      refreshCookie,
    }
  } catch (error) {
    // Re-throw InternalServerError as-is
    if (error instanceof InternalServerError) {
      throw error
    }

    // Handle network errors
    logger.error({ error }, 'Network error during Assistcard authentication')
    throw new InternalServerError('Failed to connect to Assistcard API')
  }
}

/**
 * Refresh Assistcard token using refresh cookie
 * @returns New token and expiration date (with 5-minute safety margin)
 * @throws Error if refresh fails (caller should fallback to login)
 */
async function assistcardRefreshToken(): Promise<{ token: string; expiresAt: Date }> {
  if (!env.ASSISTCARD_API_URL) {
    throw new Error('ASSISTCARD_API_URL not configured')
  }

  if (!cachedToken?.refreshCookie) {
    throw new Error('No refresh cookie available')
  }

  logger.debug('Attempting to refresh Assistcard token')

  const response = await fetch(`${env.ASSISTCARD_API_URL}/api/Authentication/token/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      Authorization: `Bearer ${cachedToken.token}`,
      Cookie: cachedToken.refreshCookie, // Send refresh cookie manually
    },
  })

  const data: AssistcardRefreshResponse = await response.json()

  // Check for refresh failure
  if (!response.ok || !data.isSuccess || !data.data) {
    logger.debug(
      {
        status: response.status,
        traceId: data.traceId,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      },
      'Assistcard token refresh failed'
    )
    throw new Error(
      `Token refresh failed: ${data.errorMessage || 'Unknown error'} (traceId: ${data.traceId})`
    )
  }

  // Calculate expiration with 5-minute safety margin
  const expiresAt = new Date(data.data.expiration)
  const safeExpiresAt = new Date(expiresAt.getTime() - 5 * 60 * 1000)

  logger.info(
    {
      traceId: data.traceId,
      expiresAt: safeExpiresAt.toISOString(),
    },
    'Successfully refreshed Assistcard token'
  )

  return {
    token: data.data.token,
    expiresAt: safeExpiresAt,
  }
}
