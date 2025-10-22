import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './logger.js';

/**
 * Apply security middleware to the Express app
 * Should be called early in the middleware chain, after request logging
 */
export const applySecurityMiddleware = (app: Express): void => {
  // CORS - Allow all origins for now
  app.use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Helmet - Security headers
  app.use(
    helmet({
      // Relax CSP for API-only server (no HTML rendering)
      contentSecurityPolicy: false,
      // Keep other defaults enabled
    })
  );

  // Rate limiting - 100 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
      logger.warn({
        ip: req.ip,
        path: req.path,
        message: 'Rate limit exceeded',
      });
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later',
        statusCode: 429,
      });
    },
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (10mb limit)
  app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded bodies

  logger.info('Security middleware applied: CORS, Helmet, Rate Limiting, Body Parsing');
};
