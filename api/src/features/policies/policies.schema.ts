import type { Policy, Passenger, Quote } from '@prisma/client'
import { z } from 'zod'

import { issueVouchersRequestSchema } from '../assistcard/issue/index.js'
import type { Voucher } from '../assistcard/issue/index.js'

// ========== Request Schema ==========

/**
 * Policy issuance request schema
 * Extends Assistcard issue schema with optional business logic fields
 */
export const issuePolicyRequestSchema = issueVouchersRequestSchema.extend({
  // Optional: Link to existing saved quote (for tracking)
  quoteId: z.string().uuid().optional(),
})

// ========== Response Types ==========

/**
 * Complete result of policy issuance
 * Includes all created/updated database records + Assistcard voucher data
 */
export interface IssuePolicyResult {
  quote: Quote // Created quote snapshot
  passengers: Passenger[] // Upserted passenger records
  policies: Policy[] // Created policy records (one per passenger)
  vouchers: Voucher[] // Assistcard voucher data (for immediate display/download)
}

// ========== Exported Types ==========

export type IssuePolicyRequest = z.infer<typeof issuePolicyRequestSchema>
