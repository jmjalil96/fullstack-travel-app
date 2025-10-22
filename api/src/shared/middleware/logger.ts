import pino from 'pino'

import { env } from '../../config/env.js'

/**
 * Configured pino logger instance
 * - Development: Pretty formatted, debug level
 * - Production: JSON formatted, info level
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: label => {
      return { level: label }
    },
  },
  base: {
    env: env.NODE_ENV,
  },
})
