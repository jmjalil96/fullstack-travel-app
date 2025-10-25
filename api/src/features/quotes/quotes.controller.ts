import { Request, Response } from 'express'

import { UnauthorizedError } from '../../shared/errors/errors.js'
import { logger } from '../../shared/middleware/logger.js'

import type { SaveQuoteRequest } from './quotes.schema.js'
import { saveQuote, getQuote } from './quotes.service.js'

/**
 * POST /api/quotes
 * Save quote for later resumption
 */
export async function postSaveQuote(req: Request, res: Response): Promise<void> {
  // Ensure user is authenticated
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated')
  }

  logger.info(
    {
      userId: req.user.id,
      origin: req.body.origin,
      destination: req.body.destination,
      productName: req.body.productName,
    },
    'User saving quote'
  )

  const params = req.body as SaveQuoteRequest
  const result = await saveQuote(params, req.user.id)

  res.json({
    success: true,
    data: result,
  })
}

/**
 * GET /api/quotes/:id
 * Load saved quote for resumption
 */
export async function getQuoteById(req: Request, res: Response): Promise<void> {
  // Ensure user is authenticated
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated')
  }

  logger.info(
    {
      userId: req.user.id,
      quoteId: req.params.id,
    },
    'User loading quote'
  )

  const quote = await getQuote(req.params.id, req.user.id)

  res.json({
    success: true,
    data: quote,
  })
}
