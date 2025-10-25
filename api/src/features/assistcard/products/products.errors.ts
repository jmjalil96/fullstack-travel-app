import { AppError } from '../../../shared/errors/errors.js'

import type { AssistcardError } from './products.schema.js'

/**
 * Custom error class for Assistcard API failures
 * Used for all Assistcard endpoints (products, addons, issue, cancel, etc.)
 */
export class AssistcardApiError extends AppError {
  public readonly traceId: string
  public readonly errorCode?: string

  constructor(
    message: string,
    traceId: string,
    errorCode?: string,
    statusCode: number = 502
  ) {
    // Pass traceId/errorCode via metadata for error handler
    super(message, statusCode, true, { traceId, errorCode })
    this.name = 'AssistcardApiError'
    this.traceId = traceId
    this.errorCode = errorCode

    // Required for proper instanceof checks
    Object.setPrototypeOf(this, AssistcardApiError.prototype)
  }
}

/**
 * Create AssistcardApiError from Assistcard API error response
 */
export function createAssistcardApiError(error: AssistcardError): AssistcardApiError {
  const message = error.errorMessage || error.title || 'Unknown Assistcard API error'
  const errorCode = error.errorCode
  const statusCode = mapAssistcardStatusCode(error.status)

  return new AssistcardApiError(message, error.traceId, errorCode, statusCode)
}

/**
 * Map Assistcard HTTP status to our API status code
 */
function mapAssistcardStatusCode(assistcardStatus?: number): number {
  if (!assistcardStatus) return 502 // Bad Gateway (external API failed)

  // Map Assistcard errors to appropriate client-facing status codes
  switch (assistcardStatus) {
    case 400:
      return 400 // Bad Request (invalid params we sent)
    case 401:
      return 502 // Our credentials issue, not client's fault
    case 403:
      return 502 // Our permissions issue
    case 404:
      return 404 // Resource not found
    case 422:
      return 400 // Validation error
    case 429:
      return 503 // Rate limited (service unavailable)
    case 500:
    case 502:
    case 503:
    case 504:
      return 502 // Assistcard server issues
    default:
      return 502 // Unknown error from external API
  }
}
