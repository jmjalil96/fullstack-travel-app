/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly metadata?: Record<string, unknown>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: Record<string, unknown>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.metadata = metadata

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', metadata?: Record<string, unknown>) {
    super(message, 400, true, metadata)
    Object.setPrototypeOf(this, BadRequestError.prototype)
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', metadata?: Record<string, unknown>) {
    super(message, 401, true, metadata)
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

/**
 * 403 Forbidden - Authenticated but not allowed
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', metadata?: Record<string, unknown>) {
    super(message, 403, true, metadata)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', metadata?: Record<string, unknown>) {
    super(message, 404, true, metadata)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', metadata?: Record<string, unknown>) {
    super(message, 409, true, metadata)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

/**
 * 500 Internal Server Error - Unexpected error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', metadata?: Record<string, unknown>) {
    super(message, 500, false, metadata)
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}
