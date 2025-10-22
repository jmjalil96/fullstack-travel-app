import { type IncomingMessage, type ServerResponse } from 'http'

import pinoHttp from 'pino-http'

import { env } from '../../config/env.js'

import { logger } from './logger.js'

/**
 * HTTP request logging middleware
 * - Logs all incoming requests with auto-generated request IDs
 * - Logs response status and duration
 * - Attaches request ID to req.log for use in other middleware
 */
// @ts-expect-error - pino-http is CommonJS, works correctly at runtime with esModuleInterop
export const requestLogger = pinoHttp({
  logger,
  autoLogging: true,
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (res.statusCode >= 500 || err) {
      return 'error'
    }
    if (res.statusCode >= 400) {
      return 'warn'
    }
    return env.NODE_ENV === 'production' ? 'info' : 'debug'
  },
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },
  customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`
  },
})
