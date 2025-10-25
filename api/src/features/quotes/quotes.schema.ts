import type { Quote } from '@prisma/client'
import { z } from 'zod'


// ========== Save Quote Schema ==========

/**
 * Save quote request (after Step 3 - product + addons selected)
 */
export const saveQuoteRequestSchema = z.object({
  // Travel parameters
  origin: z.string().min(1),
  destination: z.string().min(1),
  beginDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/),
  endDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/),
  travelType: z.number().int().default(1),

  // Passengers (flexible JSON - minimal or full)
  passengersCount: z.number().int().min(1).max(16),
  passengers: z.array(z.any()), // Flexible structure (minimal or full passenger data)

  // Selected product (required - Step 2 must be complete)
  productCode: z.string().min(1),
  rateCode: z.string().min(1),
  productName: z.string().min(1),
  quotedTotal: z.number().positive(),
  quotedCurrency: z.string().default('USD'),

  // Optional metadata
  exchangeRate: z.number().optional(),
  processingFee: z.number().optional(),

  // Selected addons (JSON per passenger)
  selectedAddons: z.array(z.any()).optional(), // Flexible structure

  // Price modifiers
  promotionalCode: z.string().optional(),
})

/**
 * Save quote response
 */
export interface SaveQuoteResult {
  id: string
  expiresAt: Date
}

/**
 * Get quote response (for resume)
 */
export type GetQuoteResult = Quote

// ========== Get Quote Params ==========

/**
 * URL params validation for GET /api/quotes/:id
 */
export const getQuoteParamsSchema = z.object({
  id: z.string().uuid(),
})

// ========== Exported Types ==========

export type SaveQuoteRequest = z.infer<typeof saveQuoteRequestSchema>
export type GetQuoteParams = z.infer<typeof getQuoteParamsSchema>
