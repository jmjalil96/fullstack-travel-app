import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodSchema } from 'zod'

import { BadRequestError } from '../errors/errors.js'

interface ValidationSchemas {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

/**
 * Middleware factory for validating request data using Zod schemas
 *
 * @example
 * const schema = z.object({ name: z.string(), email: z.string().email() });
 * app.post('/users', validateRequest({ body: schema }), handler);
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body)
      }

      // Validate query params if schema provided
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query
      }

      // Validate URL params if schema provided
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Format zod errors into readable structure
        const issues = error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))

        next(new BadRequestError('Validation failed', { issues }))
        return
      }
      next(error)
    }
  }
}
