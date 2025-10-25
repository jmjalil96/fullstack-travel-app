import { Router } from 'express'

import { asyncHandler } from '../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../shared/middleware/validation.js'

import { postSaveQuote, getQuoteById } from './quotes.controller.js'
import { saveQuoteRequestSchema, getQuoteParamsSchema } from './quotes.schema.js'

const router = Router()

/**
 * POST /api/quotes
 * Save quote after Step 3 (product + addons selected)
 *
 * Requires: Authentication
 * Body: {
 *   origin, destination, beginDate, endDate,
 *   passengers (minimal or full),
 *   productCode, rateCode, productName, quotedTotal,
 *   selectedAddons?, promotionalCode?
 * }
 */
router.post('/', requireAuth, validateRequest({ body: saveQuoteRequestSchema }), asyncHandler(postSaveQuote))

/**
 * GET /api/quotes/:id
 * Load saved quote for wizard resumption
 *
 * Requires: Authentication
 * Params: { id: uuid }
 */
router.get('/:id', requireAuth, validateRequest({ params: getQuoteParamsSchema }), asyncHandler(getQuoteById))

export { router as quotesRouter }
