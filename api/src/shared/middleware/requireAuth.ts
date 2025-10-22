import { fromNodeHeaders } from 'better-auth/node'
import { Request, Response, NextFunction } from 'express'

import { auth } from '../../config/auth.js'
import { UnauthorizedError } from '../errors/errors.js'

/**
 * Middleware to protect routes - requires valid session
 * Attaches user to req.user if authenticated
 * Throws UnauthorizedError if no valid session
 *
 * @example
 * app.get('/api/policies', requireAuth, asyncHandler(async (req, res) => {
 *   // req.user is available here
 *   const policies = await db.policy.findMany({ where: { userId: req.user.id } });
 *   res.json({ policies });
 * }));
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  auth.api
    .getSession({
      headers: fromNodeHeaders(req.headers),
    })
    .then(session => {
      if (!session?.user) {
        throw new UnauthorizedError('Authentication required')
      }

      // Attach user to request for use in route handlers
      req.user = session.user
      next()
    })
    .catch(next) // Pass errors to Express error handler
}
