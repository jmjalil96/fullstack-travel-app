import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getQuoteProducts, getQuoteAddons } from './products.controller.js'
import { quoteProductRequestSchema, quoteAddonsRequestSchema } from './products.schema.js'

const router = Router()

// Request schemas without Point Emisor fields (injected from env)
const productsRequestSchema = quoteProductRequestSchema.omit({
  countryCode: true,
  agencyCode: true,
  branchCode: true,
})

const addonsRequestSchema = quoteAddonsRequestSchema.omit({
  countryCode: true,
  agencyCode: true,
  branchCode: true,
})

/**
 * POST /api/assistcard/quote/products
 * Get available insurance products based on travel parameters
 *
 * Requires: Authentication
 * Body: { beginDate, endDate, itinerary, passengers, ... }
 */
router.post(
  '/products',
  requireAuth,
  validateRequest({ body: productsRequestSchema }),
  asyncHandler(getQuoteProducts)
)

/**
 * POST /api/assistcard/quote/addons
 * Get optional coverage addons for a selected product
 *
 * Requires: Authentication
 * Body: { beginDate, endDate, productCode, rateCode, passengers, ... }
 */
router.post(
  '/addons',
  requireAuth,
  validateRequest({ body: addonsRequestSchema }),
  asyncHandler(getQuoteAddons)
)

export { router as productsRouter }
