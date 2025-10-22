import express, { Request, Response } from 'express';
import { z } from 'zod';
import { toNodeHandler } from 'better-auth/node';
import { env } from './config/env.js';
import { auth } from './config/auth.js';
import { errorHandler } from './shared/errors/errorHandler.js';
import { NotFoundError } from './shared/errors/errors.js';
import { requestLogger } from './shared/middleware/requestLogger.js';
import { applySecurityMiddleware } from './shared/middleware/security.js';
import { validateRequest } from './shared/middleware/validation.js';
import { asyncHandler } from './shared/middleware/asyncHandler.js';
import { requireAuth } from './shared/middleware/requireAuth.js';

const app = express();

// 1. Request logging - first to log everything
app.use(requestLogger);

// 2. Auth routes (BEFORE body parsing - BetterAuth handles its own body parsing)
app.all('/api/auth/*', toNodeHandler(auth));

// 3. Security middleware - CORS, Helmet, Rate Limiting, Body Parsing
applySecurityMiddleware(app);

// 4. Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Demo: Request validation example
const demoUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
});

app.post(
  '/demo/validate',
  validateRequest({ body: demoUserSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: 'Validation passed!',
      data: req.body,
    });
  })
);

// Demo: Protected route (requires authentication)
app.get(
  '/api/protected',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: 'This is a protected route',
      user: {
        id: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
      },
    });
  })
);

// 4. 404 handler - must be after all other routes
app.use((_req: Request, _res: Response) => {
  throw new NotFoundError('Route not found');
});

// 5. Global error handler - must be LAST
app.use(errorHandler);

export { app };
