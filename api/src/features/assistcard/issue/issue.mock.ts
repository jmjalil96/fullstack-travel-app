import { logger } from '../../../shared/middleware/logger.js'

import type { IssueVouchersRequest, IssueVouchersResponseData } from './issue.schema.js'

/**
 * Mock implementation of Assistcard Issue Vouchers API
 * Returns realistic voucher data for development/testing
 */
export async function issueVouchers(
  params: Omit<IssueVouchersRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  _authToken: string
): Promise<IssueVouchersResponseData> {
  logger.info(
    {
      productCode: params.productCode,
      rateCode: params.rateCode,
      passengersCount: params.passengers.length,
      paymentAmount: params.paymentDetails.amount,
    },
    '🎭 Using MOCK Assistcard Issue Vouchers API'
  )

  // Generate mock IDs
  const voucherGroup = Math.floor(100000000 + Math.random() * 900000000)
  const issuanceDate = new Date().toISOString().split('T')[0].replace(/-/g, '/')

  // Calculate base price per passenger (excluding addons)
  const totalPassengers = params.passengers.length
  const baseProductPrice = params.paymentDetails.amount

  // Determine if promo code was applied
  const promoCode = params.priceModifiers?.promotionalCode || null

  // Generate voucher for each passenger
  const vouchers = params.passengers.map((passenger, index) => {
    // Generate unique voucher code
    const voucherCode = Math.floor(100000000 + Math.random() * 900000000)

    // Calculate passenger's base price
    const passengerBasePrice = baseProductPrice / totalPassengers

    // Calculate addons total for this passenger
    const addonsTotal =
      passenger.addons?.reduce((sum, addon) => {
        // Mock addon pricing based on category
        const addonPrice = addon.category / 10000 // e.g., 50000 → $5
        return sum + addonPrice
      }, 0) || 0

    const passengerTotal = passengerBasePrice + addonsTotal

    // Build addon amount details if passenger has addons
    const addonAmounts =
      passenger.addons?.map(addon => ({
        code: addon.code,
        rateCode: addon.rateCode,
        category: addon.category,
        totalOriginal: addon.category / 10000,
        total: addon.category / 10000,
        subtotalAssistance: (addon.category / 10000) * 0.8,
        subtotalInsurance: (addon.category / 10000) * 0.2,
        financialTaxes: 0,
        promotionalCode: null,
      })) || []

    return {
      code: voucherCode,
      policyCode: null, // Only for Brazil/Spain
      bookingCode: passenger.bookingCode || `MOCK-${index + 1}`,
      documentNumber: passenger.documentNumber,
      lastName: passenger.lastname,
      name: passenger.name,
      ekitURL: `https://documents.assistcard.com/voucher/${voucherCode}`,
      policyURL: null, // Only for Brazil/Spain
      productCode: params.productCode,
      productName: `${params.productCode} ${params.rateCode}`,
      effectiveDateStart: params.beginDate,
      effectiveDateEnd: params.endDate,
      amountRate: {
        totalOriginal: passengerTotal,
        total: passengerTotal,
        subtotalAssistance: passengerTotal * 0.7,
        subtotalInsurance: passengerTotal * 0.3,
        financialTaxes: 0,
        promotionalCode: promoCode,
        addons: addonAmounts,
      },
    }
  })

  // Calculate total paid (sum of all vouchers)
  const totalPaid = vouchers.reduce((sum, v) => sum + v.amountRate.total, 0)

  // Mock exchange rate
  const exchangeRate = 1050.5

  // Build payment details
  const paymentDetails = {
    method: 'CreditCard',
    brand: params.paymentDetails.brand,
    installments: params.paymentDetails.installments || 1,
    referenceNumber: `TXN_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    currency: params.paymentDetails.currency || 'ARS',
    totalPaid: totalPaid * exchangeRate, // Convert to local currency
    amountRate: {
      totalOriginal: totalPaid,
      total: totalPaid,
      processingFee: 2.5,
      financialTaxes: 0,
      financialInterest: 0,
      taxesIncluded: totalPaid,
      noTaxesIncluded: totalPaid,
      assistance: totalPaid * 0.7,
      insurance: totalPaid * 0.3,
    },
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  logger.info(
    {
      voucherGroup,
      vouchersCount: vouchers.length,
      totalPaid: paymentDetails.totalPaid,
      currency: paymentDetails.currency,
    },
    '🎭 Mock API issued vouchers successfully'
  )

  return {
    countryIdentifier: 54, // Mock country identifier (Argentina)
    voucherGroup,
    issuanceDate,
    exchangeRate,
    vouchers,
    paymentDetails,
  }
}
