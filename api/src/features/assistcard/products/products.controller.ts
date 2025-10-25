import { Request, Response } from 'express'

import { logger } from '../../../shared/middleware/logger.js'
import { getValidToken } from '../auth/token-manager.js'

import type { QuoteProductRequest, QuoteAddonsRequest } from './products.schema.js'

import { quoteProducts, quoteAddons } from './index.js'

/**
 * POST /api/assistcard/quote/products
 * Get available insurance products from Assistcard
 */
export async function getQuoteProducts(req: Request, res: Response): Promise<void> {
  logger.info(
    {
      userId: req.user?.id,
      origin: req.body.itinerary?.origin,
      destination: req.body.itinerary?.destination,
    },
    'User requesting quote products'
  )

  const params = req.body as Omit<QuoteProductRequest, 'countryCode' | 'agencyCode' | 'branchCode'>
  const assistcardToken = await getValidToken()
  const products = await quoteProducts(params, assistcardToken)

  res.json({
    success: true,
    data: products,
  })
}

/**
 * POST /api/assistcard/quote/addons
 * Get optional coverage addons for a selected product
 */
export async function getQuoteAddons(req: Request, res: Response): Promise<void> {
  logger.info(
    {
      userId: req.user?.id,
      productCode: req.body.productCode,
      rateCode: req.body.rateCode,
    },
    'User requesting quote addons'
  )

  const params = req.body as Omit<QuoteAddonsRequest, 'countryCode' | 'agencyCode' | 'branchCode'>
  const assistcardToken = await getValidToken()
  const addons = await quoteAddons(params, assistcardToken)

  res.json({
    success: true,
    data: addons,
  })
}
