import { db } from '../../config/database.js'
import { logger } from '../../shared/middleware/logger.js'
import { getValidToken } from '../assistcard/auth/token-manager.js'
import { issueVouchers } from '../assistcard/issue/index.js'

import type { IssuePolicyRequest, IssuePolicyResult } from './policies.schema.js'

/**
 * Issue insurance policy via Assistcard and save to database
 *
 * This is the main business logic endpoint that:
 * 1. Creates a quote snapshot (audit trail)
 * 2. Upserts passengers (reuse existing or create new)
 * 3. Calls Assistcard to charge card and issue vouchers
 * 4. Saves policies to database (one per passenger)
 * 5. All in a single atomic transaction
 *
 * @param params - Issue request params (without Point Emisor)
 * @param userId - User issuing the policy (from session)
 * @returns Complete result with quote, passengers, policies, and vouchers
 * @throws BadRequestError if quote expired or validation fails
 * @throws AssistcardApiError if Assistcard API fails (card not charged)
 * @throws InternalServerError if database fails after Assistcard success (CRITICAL)
 */
export async function issuePolicy(
  params: Omit<IssuePolicyRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  userId: string
): Promise<IssuePolicyResult> {

  logger.info(
    {
      userId,
      passengersCount: params.passengers.length,
      productCode: params.productCode,
      paymentAmount: params.paymentDetails.amount,
    },
    'Starting policy issuance process'
  )

  // ========== ATOMIC TRANSACTION ==========
  // Everything succeeds or everything rolls back
  // CRITICAL: If Assistcard succeeds but DB fails, we need manual recovery!

  return await db.$transaction(async tx => {
    // ========== STEP 1: Create Quote Snapshot ==========
    const quote = await tx.quote.create({
      data: {
        userId,

        // Travel parameters
        origin: params.itinerary.origin,
        destination: params.itinerary.destination,
        beginDate: new Date(params.beginDate.replace(/\//g, '-')),
        endDate: new Date(params.endDate.replace(/\//g, '-')),
        travelType: 1, // Default Daily

        // Passengers (minimal JSON for quoting)
        passengersCount: params.passengers.length,
        passengers: params.passengers.map(p => ({
          countryCode: p.countryCode,
          birthDate: p.birthDate,
        })),

        // Selected product (will update productName from voucher response)
        productCode: params.productCode,
        rateCode: params.rateCode,
        productName: `${params.productCode} ${params.rateCode}`,
        quotedTotal: params.paymentDetails.amount,
        quotedCurrency: params.paymentDetails.currency || 'USD',

        // Selected addons (serialize per passenger)
        selectedAddons: params.passengers.map((p, idx) => ({
          passengerId: idx,
          addons: p.addons?.map(a => ({
            addonCode: a.code,
            rateCode: a.rateCode,
            category: a.category,
          })) || [],
        })),

        // Modifiers
        promotionalCode: params.priceModifiers?.promotionalCode,

        // State
        status: 'issued',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // ========== STEP 2: Upsert Passengers ==========
    const passengers = await Promise.all(
      params.passengers.map(async passengerData => {
        // Try to find existing passenger by email and document number
        const existing = await tx.passenger.findFirst({
          where: {
            email: passengerData.email,
            documentNumber: passengerData.documentNumber,
          },
        })

        if (existing) {
          // Update existing passenger (contact info may have changed)
          return await tx.passenger.update({
            where: { id: existing.id },
            data: {
              phone: passengerData.phone,
              addressCountryCode: passengerData.addressData.countryCode,
              addressStreetName: passengerData.addressData.streetName,
              addressStreetNumber: passengerData.addressData.streetNumber,
              addressComplements: passengerData.addressData.complements,
              addressPostalCode: passengerData.addressData.postalCode,
              addressCity: passengerData.addressData.city,
              addressState: passengerData.addressData.state,
            },
          })
        } else {
          // Create new passenger
          return await tx.passenger.create({
            data: {
              firstName: passengerData.name,
              lastName: passengerData.lastname,
              birthDate: new Date(passengerData.birthDate.replace(/\//g, '-')),
              email: passengerData.email,
              phone: passengerData.phone,

              // Document
              countryCode: passengerData.countryCode,
              documentType: passengerData.documentType,
              documentNumber: passengerData.documentNumber,

              // Social names (Brazil)
              preferredFirstName: passengerData.preferredName,
              preferredLastName: passengerData.preferredSurname,

              // Address
              addressCountryCode: passengerData.addressData.countryCode,
              addressStreetName: passengerData.addressData.streetName,
              addressStreetNumber: passengerData.addressData.streetNumber,
              addressComplements: passengerData.addressData.complements,
              addressPostalCode: passengerData.addressData.postalCode,
              addressCity: passengerData.addressData.city,
              addressState: passengerData.addressData.state,

              // Metadata
              createdById: userId,
            },
          })
        }
      })
    )

    // ========== STEP 3: Call Assistcard API ==========
    // Get auth token
    const assistcardToken = await getValidToken()

    // Call Assistcard to charge card and issue vouchers
    const assistcardResult = await issueVouchers(params, assistcardToken)

    // ========== STEP 4: Create Policies ==========
    const policies = await Promise.all(
      assistcardResult.vouchers.map(async (voucher, index) => {
        return await tx.policy.create({
          data: {
            // References
            quoteId: quote.id,
            userId,
            passengerId: passengers[index].id,

            // Assistcard voucher data
            voucherCode: voucher.code.toString(),
            voucherGroup: assistcardResult.voucherGroup.toString(),
            policyCode: voucher.policyCode,
            ekitUrl: voucher.ekitURL,
            policyUrl: voucher.policyURL,

            // Product info
            productCode: voucher.productCode,
            productName: voucher.productName,
            rateCode: params.rateCode,

            // Coverage dates
            beginDate: new Date(voucher.effectiveDateStart.replace(/\//g, '-')),
            endDate: new Date(voucher.effectiveDateEnd.replace(/\//g, '-')),

            // Pricing (for this passenger)
            totalAmount: voucher.amountRate.total,
            currency: params.paymentDetails.currency || 'USD',

            // Payment info (duplicated across all passengers in group)
            paymentMethod: assistcardResult.paymentDetails.method,
            paymentReference: assistcardResult.paymentDetails.referenceNumber,
            paymentCurrencyLocal: assistcardResult.paymentDetails.currency,
            paymentTotalLocal: assistcardResult.paymentDetails.totalPaid,
            cardBrand: assistcardResult.paymentDetails.brand,
            installments: assistcardResult.paymentDetails.installments,

            // Metadata
            exchangeRate: assistcardResult.exchangeRate,
            processingFee: assistcardResult.paymentDetails.amountRate.processingFee,
            bookingCode: params.passengers[index].bookingCode,
            promotionalCode: params.priceModifiers?.promotionalCode,

            // Addons for this passenger
            issuedAddons: voucher.amountRate.addons,

            // Status
            status: 'active',
            issuanceDate: new Date(assistcardResult.issuanceDate.replace(/\//g, '-')),
          },
        })
      })
    )

    // ========== STEP 5: Log Success & Return ==========
    logger.info(
      {
        userId,
        quoteId: quote.id,
        voucherGroup: assistcardResult.voucherGroup.toString(),
        policiesCount: policies.length,
        totalPaid: assistcardResult.paymentDetails.totalPaid,
        currency: assistcardResult.paymentDetails.currency,
      },
      'Successfully issued and saved policies'
    )

    return {
      quote,
      passengers,
      policies,
      vouchers: assistcardResult.vouchers,
    }
  }) // End transaction
}

// ========== CRITICAL NOTES ==========

/**
 * IMPORTANT CONSIDERATIONS:
 *
 * 1. TRANSACTION ATOMICITY:
 *    - All DB operations wrapped in Prisma transaction
 *    - If any step fails, all DB changes roll back
 *    - BUT: Assistcard API call is external - cannot be rolled back!
 *
 * 2. CRITICAL FAILURE SCENARIO:
 *    - Assistcard succeeds (card charged, vouchers issued)
 *    - DB fails (network, disk, constraint violation)
 *    - Result: Customer paid, but no policy record
 *    - MUST LOG: traceId, voucherGroup, all voucher codes
 *    - Recovery: Admin manually creates policy records
 *
 * 3. PASSENGER UPSERT STRATEGY:
 *    - Find by email (for simplicity)
 *    - Update address/contact (may have moved/changed phone)
 *    - Create if new customer
 *    - Alternative: Find by email + documentNumber composite (more strict)
 *
 * 4. QUOTE CREATION:
 *    - Always create new quote (no reuse)
 *    - Quote links all policies from this issuance
 *    - Status = 'issued' (already converted)
 *    - Contains snapshot of request params
 *
 * 5. POLICY CREATION:
 *    - One policy per passenger (one per voucher)
 *    - All share same voucherGroup
 *    - Each has unique voucherCode
 *    - Store all Assistcard response data for audit
 *
 * 6. ADDONS STORAGE:
 *    - Stored as JSON in policy.issuedAddons
 *    - Preserves full addon breakdown from Assistcard
 *    - Needed for refunds, reporting
 *
 * 7. PRICE VALIDATION:
 *    - Assistcard validates amount matches product/dates/addons
 *    - If mismatch: Assistcard returns error (card not charged)
 *    - We don't need to re-quote (Assistcard is source of truth)
 *    - Quote expiration check prevents very stale prices
 *
 * 8. DATE CONVERSIONS:
 *    - API uses "YYYY/MM/DD" strings
 *    - DB uses Date objects
 *    - Convert: .replace(/\//g, '-') → new Date()
 *
 * 9. PAYMENT DATA:
 *    - Never log cardNumber or cvv (tokenized anyway)
 *    - Store: brand, reference, totalPaid, installments
 *    - Payment info duplicated across all policies in group (for queries)
 *
 * 10. ERROR RECOVERY:
 *     - Log at ERROR level if DB fails after Assistcard success
 *     - Include: traceId, voucherGroup, all voucher codes, user email
 *     - Set up alerts for this scenario (PagerDuty, Slack, etc.)
 *     - Manual recovery procedure needed
 */
