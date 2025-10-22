import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to catch rejected promises
 * and pass them to Express error handling middleware
 *
 * @example
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await findUser(req.params.id);
 *   if (!user) throw new NotFoundError('User not found');
 *   res.json(user);
 * }));
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
