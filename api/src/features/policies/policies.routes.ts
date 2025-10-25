import { Router } from 'express'

import { asyncHandler } from '../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../shared/middleware/validation.js'

import { postIssuePolicy } from './policies.controller.js'
import { issuePolicyRequestSchema } from './policies.schema.js'

const router = Router()

// Request schema without Point Emisor fields (injected from env)
const requestBodySchema = issuePolicyRequestSchema.omit({
  countryCode: true,
  agencyCode: true,
  branchCode: true,
})

/**
 * POST /api/policies/issue
 * Issue insurance vouchers with credit card payment and save to database
 *
 * This endpoint:
 * - Creates quote snapshot
 * - Upserts passengers
 * - Calls Assistcard to charge card and issue vouchers
 * - Saves policies to database
 * - All in a single atomic transaction
 *
 * Requires: Authentication
 * Body: {
 *   counterCode, productCode, rateCode,
 *   beginDate, endDate, itinerary,
 *   passengers (full details + address + addons),
 *   paymentDetails (tokenized card data),
 *   priceModifiers?, quoteId?
 * }
 */
router.post('/issue', requireAuth, validateRequest({ body: requestBodySchema }), asyncHandler(postIssuePolicy))

export { router as policiesRouter }
