import { db } from '../../config/database.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../../shared/errors/errors.js'
import { logger } from '../../shared/middleware/logger.js'

import type { SaveQuoteRequest, SaveQuoteResult, GetQuoteResult } from './quotes.schema.js'

/**
 * Save quote to database (after Step 3 - product + addons selected)
 *
 * This endpoint saves wizard state for later resumption.
 * Agent can save quote, close browser, and resume later.
 *
 * Requirements:
 * - Step 2 must be complete (product selected)
 * - Step 3 optional (addons may or may not be selected)
 * - Passengers can be minimal (just countryCode, birthDate) or full (if Step 4 filled)
 *
 * @param params - Quote data from wizard (Steps 1-3, optionally Step 4)
 * @param userId - User saving the quote
 * @returns Quote ID and expiration date
 * @throws BadRequestError if product not selected (Step 2 incomplete)
 */
export async function saveQuote(
  params: SaveQuoteRequest,
  userId: string
): Promise<SaveQuoteResult> {
  // Validate Step 2 complete (product selected)
  if (!params.productCode || !params.rateCode) {
    throw new BadRequestError('Cannot save quote: Product must be selected (complete Step 2)')
  }

  // Create Quote record
  const quote = await db.quote.create({
    data: {
      userId,

      // Travel parameters
      origin: params.origin,
      destination: params.destination,
      beginDate: new Date(params.beginDate.replace(/\//g, '-')),
      endDate: new Date(params.endDate.replace(/\//g, '-')),
      travelType: params.travelType,

      // Passengers (JSON - flexible structure)
      passengersCount: params.passengersCount,
      passengers: params.passengers,

      // Selected product
      productCode: params.productCode,
      rateCode: params.rateCode,
      productName: params.productName,
      quotedTotal: params.quotedTotal,
      quotedCurrency: params.quotedCurrency,

      // Optional metadata
      exchangeRate: params.exchangeRate,
      processingFee: params.processingFee,

      // Selected addons
      selectedAddons: params.selectedAddons,

      // Price modifiers
      promotionalCode: params.promotionalCode,

      // Status
      status: 'saved',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  logger.info(
    {
      userId,
      quoteId: quote.id,
      origin: params.origin,
      destination: params.destination,
      productName: params.productName,
      expiresAt: quote.expiresAt.toISOString(),
    },
    'Quote saved successfully'
  )

  return {
    id: quote.id,
    expiresAt: quote.expiresAt,
  }
}

// ========== NOTES ==========

/**
 * IMPORTANT CONSIDERATIONS:
 *
 * 1. PASSENGER DATA FLEXIBILITY:
 *    - passengers JSON can contain minimal or full data
 *    - No validation on JSON structure (client state serialization)
 *    - Minimal (Steps 1-3): [{ countryCode, birthDate }]
 *    - Full (Step 4 filled): [{ countryCode, birthDate, name, email, addressData, ... }]
 *    - Frontend handles detection on resume (check if email field exists)
 *
 * 2. EXPIRATION:
 *    - 24 hours from save time
 *    - Frontend should check expiresAt before resuming
 *    - Expired quotes can still be viewed but should warn user to re-quote
 *
 * 3. NO ASSISTCARD CALL:
 *    - This is just state persistence
 *    - No external API calls
 *    - No payment processing
 *    - Fast operation (single DB insert)
 *
 * 4. STATUS:
 *    - Always "saved" (never "issued")
 *    - "issued" status only set by issuePolicy()
 *    - Saved quotes can be resumed multiple times
 *
 * 5. RESUMING:
 *    - GET /api/quotes/:id returns this data
 *    - Frontend hydrates Zustand with quote data
 *    - Takes user to Step 4 (payment/passenger entry)
 *    - If passengers JSON has full data → pre-fill form
 *    - If passengers JSON is minimal → empty form
 *
 * 6. MULTIPLE SAVES:
 *    - Agent can save unlimited quotes
 *    - Each save creates new quote record
 *    - No updates to existing quotes (read-only after save)
 *    - Agent can compare multiple saved quotes
 *
 * 7. VALIDATION:
 *    - Must have productCode and rateCode (Step 2 complete)
 *    - Dates must be valid format (YYYY/MM/DD)
 *    - passengersCount must match array length
 *    - quotedTotal must be positive number
 *
 * 8. SECURITY:
 *    - userId from authenticated session (not from request)
 *    - No payment data in quotes (saved separately on issue)
 *    - Quote belongs to specific user (can't access other users' quotes)
 */

/**
 * Get quote by ID for resumption
 *
 * This endpoint loads a saved quote for the wizard to resume.
 * Frontend hydrates Zustand store with this data and goes to Step 4.
 *
 * Security:
 * - Validates quote belongs to user (can't access other users' quotes)
 * - Returns expired quotes (frontend shows warning)
 * - Returns issued quotes (frontend can show "already converted")
 *
 * @param quoteId - Quote ID to load
 * @param userId - User requesting the quote (from session)
 * @returns Complete quote data for hydration
 * @throws NotFoundError if quote doesn't exist
 * @throws ForbiddenError if quote belongs to different user
 */
export async function getQuote(
  quoteId: string,
  userId: string
): Promise<GetQuoteResult> {
  // Find quote by ID
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
  })

  // Validate exists
  if (!quote) {
    throw new NotFoundError('Quote not found')
  }

  // Validate ownership
  if (quote.userId !== userId) {
    throw new ForbiddenError('You do not have permission to access this quote')
  }

  // Check expiration (warning only)
  const isExpired = quote.expiresAt < new Date()
  if (isExpired) {
    logger.warn(
      { userId, quoteId, expiresAt: quote.expiresAt.toISOString() },
      'User loading expired quote'
    )
  }

  // Check status (info only)
  if (quote.status === 'issued') {
    logger.info({ userId, quoteId }, 'User loading already-issued quote')
  }

  // Log access
  logger.info(
    {
      userId,
      quoteId,
      origin: quote.origin,
      destination: quote.destination,
      status: quote.status,
      isExpired,
    },
    'Quote loaded for resumption'
  )

  return quote
}

// ========== GET QUOTE NOTES ==========

/**
 * IMPORTANT CONSIDERATIONS:
 *
 * 1. READ-ONLY OPERATION:
 *    - No database writes
 *    - No Assistcard calls
 *    - Fast query (single SELECT)
 *
 * 2. OWNERSHIP VALIDATION:
 *    - CRITICAL: Check quote.userId === userId
 *    - Prevents users accessing other users' quotes
 *    - Return 403 Forbidden if mismatch
 *
 * 3. EXPIRATION HANDLING:
 *    - Don't block expired quotes
 *    - Still return data (frontend shows warning)
 *    - Log warning for monitoring
 *    - User can decide: re-quote or proceed (prices might have changed)
 *
 * 4. ALREADY ISSUED HANDLING:
 *    - If status === 'issued', quote was already converted to policy
 *    - Still return data (for reference)
 *    - Frontend can show "This quote was already issued" message
 *    - Frontend can navigate to policy view instead
 *
 * 5. FRONTEND HYDRATION:
 *    - Frontend receives quote data
 *    - Hydrates Zustand store with all fields
 *    - Checks passengers JSON structure:
 *      - If has email → pre-fill Step 4 form
 *      - If minimal → show empty Step 4 form
 *    - Takes user to Step 4
 *
 * 6. NO STATE MUTATION:
 *    - Quote record not modified
 *    - Read-only access
 *    - Can be loaded multiple times
 *
 * 7. PERFORMANCE:
 *    - Single SELECT query
 *    - No joins needed (quote data is denormalized)
 *    - Fast response (~10ms)
 */
