import { logger } from '../../../shared/middleware/logger.js'

import { createAssistcardApiError, AssistcardApiError } from './issue.errors.js'
import { issueVouchersRequestSchema, issueVouchersResponseSchema } from './issue.schema.js'
import type { IssueVouchersRequest, IssueVouchersResponseData } from './issue.schema.js'

/**
 * Call Assistcard Issue Policy API to create insurance vouchers
 *
 * This is the most complex endpoint - it:
 * - Charges customer's credit card
 * - Creates insurance policies in Assistcard system
 * - Returns one voucher per passenger (max 16)
 * - Requires PCI-compliant tokenized card data
 *
 * @param params - Issue parameters (without Point Emisor credentials)
 * @param authToken - Valid Assistcard bearer token
 * @returns Issue data with voucherGroup and individual vouchers
 * @throws AssistcardApiError on API failure or network error
 *
 * @example
 * const vouchers = await issueVouchers({
 *   counterCode: 'AG001',
 *   productCode: 'AC',
 *   rateCode: '150',
 *   beginDate: '2025/02/01',
 *   endDate: '2025/02/15',
 *   itinerary: { code: 'AIRPORT', origin: 'EZE', destination: 'MIA' },
 *   passengers: [{
 *     countryCode: 'AR',
 *     documentType: 1,
 *     documentNumber: '12345678',
 *     birthDate: '1990/05/15',
 *     lastname: 'Garcia',
 *     name: 'Juan',
 *     email: 'juan@example.com',
 *     phone: '54 11 22223333',
 *     addressData: {
 *       countryCode: 'AR',
 *       streetName: 'Av. Corrientes',
 *       streetNumber: '1234',
 *       postalCode: 'C1043',
 *       city: 'Buenos Aires',
 *       state: 'Buenos Aires'
 *     },
 *     addons: [{ code: 'COVID', rateCode: 'COVID_BASIC', category: 50000 }]
 *   }],
 *   paymentDetails: {
 *     amount: 450.00,
 *     cardNumber: '{{{400000Cpcp3Q1091}}}',  // Tokenized!
 *     cvv: '{{{tokenized_cvv}}}',            // Tokenized!
 *     cardHolder: 'Juan Garcia',
 *     expirationDate: '12/27',
 *     brand: 'VISA',
 *     documentNumber: '12345678',
 *     email: 'juan@example.com'
 *   }
 * }, token)
 */
export async function issueVouchers(
  params: Omit<IssueVouchersRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  authToken: string
): Promise<IssueVouchersResponseData> {
  // Validate environment variables
  const apiUrl = process.env.ASSISTCARD_API_URL
  if (!apiUrl) {
    throw new Error('ASSISTCARD_API_URL environment variable is not set')
  }

  // Inject Point Emisor credentials from environment
  const requestBody: IssueVouchersRequest = {
    countryCode: process.env.ASSISTCARD_COUNTRY_CODE || '',
    agencyCode: process.env.ASSISTCARD_AGENCY_CODE || '',
    branchCode: parseInt(process.env.ASSISTCARD_BRANCH_CODE || '0'),
    ...params,
  }

  // Validate complete request payload
  const validatedRequest = issueVouchersRequestSchema.parse(requestBody)

  logger.info(
    {
      productCode: validatedRequest.productCode,
      rateCode: validatedRequest.rateCode,
      passengersCount: validatedRequest.passengers.length,
      beginDate: validatedRequest.beginDate,
      endDate: validatedRequest.endDate,
      paymentAmount: validatedRequest.paymentDetails.amount,
      paymentCurrency: validatedRequest.paymentDetails.currency || 'USD',
    },
    'Calling Assistcard Issue Vouchers API'
  )

  try {
    // Call Assistcard API
    const response = await fetch(`${apiUrl}/api/v1/Issuance/credit-card/vouchers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(validatedRequest),
    })

    // Parse JSON response
    const data = await response.json()

    // Validate response schema
    const validatedResponse = issueVouchersResponseSchema.parse(data)

    // Check if API returned error response
    if (!validatedResponse.isSuccess || !validatedResponse.data) {
      logger.warn(
        {
          traceId: validatedResponse.traceId,
          errorCode: validatedResponse.errorCode,
          errorMessage: validatedResponse.errorMessage,
        },
        'Assistcard API returned error response'
      )
      throw createAssistcardApiError({
        ...validatedResponse,
        isSuccess: false,
      })
    }

    // Log successful response
    logger.info(
      {
        traceId: validatedResponse.traceId,
        voucherGroup: validatedResponse.data.voucherGroup,
        vouchersCount: validatedResponse.data.vouchers.length,
        totalPaid: validatedResponse.data.paymentDetails.totalPaid,
        currency: validatedResponse.data.paymentDetails.currency,
      },
      'Successfully issued vouchers via Assistcard'
    )

    return validatedResponse.data
  } catch (error) {
    // Re-throw AssistcardApiError as-is (already logged)
    if (error instanceof AssistcardApiError) {
      throw error
    }

    // Handle network errors and unexpected failures
    logger.error({ error }, 'Failed to call Assistcard Issue Vouchers API')

    if (error instanceof Error) {
      throw new AssistcardApiError(
        `Network error: ${error.message}`,
        'unknown',
        'NETWORK_ERROR',
        503
      )
    }

    // Unknown error type
    throw error
  }
}

// ========== CRITICAL NOTES ==========

/**
 * IMPORTANT CONSIDERATIONS FOR IMPLEMENTATION:
 *
 * 1. TOKENIZED CARD DATA:
 *    - Card numbers and CVV MUST be tokenized client-side via TokenEx
 *    - Format: {{{tokenized_value}}} (triple braces required)
 *    - Never log or store raw card data
 *    - Tokens must be wrapped before sending to this service
 *
 * 2. PCI COMPLIANCE:
 *    - This endpoint handles tokenized payment data
 *    - Requires PCI DSS certification (AOC or SAQ-D)
 *    - Never log paymentDetails object
 *    - Only log: amount, currency, brand (no card numbers)
 *
 * 3. PASSENGER DATA:
 *    - Full details required (not just birthDate like in Quote)
 *    - Each passenger must have complete addressData
 *    - documentType: 1 = Passport (default for most countries)
 *    - Phone format: "{countryCode} {areaCode} {number}" (e.g., "54 11 22223333")
 *
 * 4. ADDONS:
 *    - Addons are PER-PASSENGER (not quote-level)
 *    - Each passenger can have different addons
 *    - Must match addon selections from Quote Addons step
 *    - Format: [{ code, rateCode, category }]
 *
 * 5. RESPONSE STRUCTURE:
 *    - voucherGroup: Groups all vouchers from same issuance (family trip)
 *    - vouchers: Array with one entry per passenger
 *    - Each voucher has unique code, ekitURL (PDF)
 *    - Store voucherGroup to link policies together
 *    - Store individual voucher codes for tracking/cancellation
 *
 * 6. PRICE VALIDATION:
 *    - paymentDetails.amount MUST match quoted price from Step 2
 *    - System validates this server-side
 *    - Include financial interest if installments > 1
 *
 * 7. DATABASE INTEGRATION:
 *    - After successful issuance, create Policy records
 *    - One Policy per voucher (one per passenger)
 *    - All share same voucherGroup
 *    - Store ekitURL for voucher download
 *    - Link to Quote that originated this
 *
 * 8. BOOKING CODE:
 *    - Optional reference for each passenger
 *    - Use for tracking in your system
 *    - Can be quote ID, internal order number, etc.
 *
 * 9. COUNTER CODE:
 *    - Agent ID for commission tracking
 *    - Use Agent.agentCode from database
 *    - Enables sales attribution in Assistcard system
 *
 * 10. ERROR SCENARIOS:
 *     - PAYMENT_DECLINED: Card declined by gateway
 *     - INVALID_PRODUCT: Product/rate code doesn't exist
 *     - PRICE_MISMATCH: Amount doesn't match quote
 *     - INVALID_PASSENGER_DATA: Missing/invalid passenger info
 *     - TOKENIZATION_ERROR: Invalid token format
 */
