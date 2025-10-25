import { z } from 'zod'

// Import shared validators from products
import {
  dateStringSchema,
  countryCodeSchema,
  quoteItinerarySchema,
  quotePriceModifiersSchema,
} from '../products/products.schema.js'

// Re-export for convenience
export { dateStringSchema, countryCodeSchema, quoteItinerarySchema, quotePriceModifiersSchema }

// ========== Issue Request - Address Schema ==========

export const passengerAddressDataSchema = z.object({
  countryCode: countryCodeSchema,
  streetName: z.string().min(1),
  streetNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  complements: z.string().optional(), // Apartment, floor, etc.
})

// ========== Issue Request - Passenger Addon ==========

export const passengerAddonSchema = z.object({
  code: z.string(),
  rateCode: z.string(),
  category: z.number().int().positive(), // Coverage amount (e.g., 50000)
})

// ========== Issue Request - Passenger Schema ==========

export const issuePassengerSchema = z.object({
  // Personal info
  countryCode: countryCodeSchema,
  documentType: z.number().int().positive(),
  documentNumber: z.string().min(1),
  birthDate: dateStringSchema,
  lastname: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1), // Format: "{countryCode} {areaCode} {number}"

  // Optional (Brazil social names)
  preferredSurname: z.string().optional(),
  preferredName: z.string().optional(),

  // Optional reference
  bookingCode: z.string().optional(),

  // Nested address
  addressData: passengerAddressDataSchema,

  // Optional addons for this passenger
  addons: z.array(passengerAddonSchema).optional(),
})

// ========== Issue Request - Payment Schema ==========

export const paymentDetailsSchema = z.object({
  currency: z.string().optional(), // Defaults to local currency
  amount: z.number().positive(),
  installments: z.number().int().positive().optional().default(1),

  // Tokenized card data (wrapped in {{{...}}})
  cardNumber: z.string().regex(/^\{\{\{.+\}\}\}$/, {
    message: 'Card number must be tokenized and wrapped in triple braces: {{{token}}}',
  }),
  cardHolder: z.string().min(1),
  expirationDate: z.string().regex(/^\d{2}\/\d{2}$/, {
    message: 'Expiration date must be in MM/YY format',
  }),

  // Tokenized CVV (wrapped in {{{...}}})
  cvv: z.string().regex(/^\{\{\{.+\}\}\}$/, {
    message: 'CVV must be tokenized and wrapped in triple braces: {{{token}}}',
  }),

  documentNumber: z.string().min(1),
  brand: z.string().min(1), // e.g., "VISA", "MASTERCARD"
  email: z.string().email(),
  phone: z.string().optional(),
})

// ========== Issue Request - Complete Schema ==========

export const issueVouchersRequestSchema = z.object({
  // Point Emisor (from env vars, auto-injected)
  countryCode: countryCodeSchema,
  agencyCode: z.string().max(5),
  branchCode: z.number().int().min(0).max(999),

  // Agent & Product
  counterCode: z.string().min(1), // Agent ID
  productCode: z.string().min(1),
  rateCode: z.string().min(1),

  // Coverage dates
  beginDate: dateStringSchema,
  endDate: dateStringSchema,

  // Itinerary
  itinerary: quoteItinerarySchema,

  // Passengers (1-16 with full details)
  passengers: z.array(issuePassengerSchema).min(1).max(16),

  // Optional price modifiers
  priceModifiers: quotePriceModifiersSchema.optional(),

  // Payment details
  paymentDetails: paymentDetailsSchema,
})

// ========== Issue Response - Voucher Amount Schema ==========

export const voucherAddonAmountSchema = z.object({
  code: z.string(),
  rateCode: z.string(),
  category: z.number(),
  totalOriginal: z.number(),
  total: z.number(),
  subtotalAssistance: z.number(),
  subtotalInsurance: z.number(),
  financialTaxes: z.number(),
  promotionalCode: z.string().nullable(),
})

export const voucherAmountRateSchema = z.object({
  totalOriginal: z.number(),
  total: z.number(),
  subtotalAssistance: z.number(),
  subtotalInsurance: z.number(),
  financialTaxes: z.number(),
  promotionalCode: z.string().nullable(),
  addons: z.array(voucherAddonAmountSchema),
})

// ========== Issue Response - Voucher Schema ==========

export const voucherSchema = z.object({
  code: z.number(), // Individual voucher code
  policyCode: z.string().nullable(), // Brazil/Spain only
  bookingCode: z.string(),
  documentNumber: z.string(),
  lastName: z.string(),
  name: z.string(),
  ekitURL: z.string().url(), // Voucher PDF download
  policyURL: z.string().url().nullable(), // Policy certificate (Brazil/Spain)
  productCode: z.string(),
  productName: z.string(),
  effectiveDateStart: dateStringSchema,
  effectiveDateEnd: dateStringSchema,
  amountRate: voucherAmountRateSchema,
})

// ========== Issue Response - Payment Details ==========

export const paymentAmountRateSchema = z.object({
  totalOriginal: z.number(),
  total: z.number(),
  processingFee: z.number(),
  financialTaxes: z.number(),
  financialInterest: z.number(),
  taxesIncluded: z.number(),
  noTaxesIncluded: z.number(),
  assistance: z.number(),
  insurance: z.number(),
})

export const paymentDetailsResponseSchema = z.object({
  method: z.string(), // "CreditCard"
  brand: z.string(),
  installments: z.number().int(),
  referenceNumber: z.string(), // Transaction ID from payment gateway
  currency: z.string(),
  totalPaid: z.number(),
  amountRate: paymentAmountRateSchema,
})

// ========== Issue Response - Complete Schema ==========

export const issueVouchersResponseDataSchema = z.object({
  countryIdentifier: z.number().int(),
  voucherGroup: z.number(), // Groups all vouchers from this issuance
  issuanceDate: dateStringSchema,
  exchangeRate: z.number(),
  vouchers: z.array(voucherSchema),
  paymentDetails: paymentDetailsResponseSchema,
})

export const issueVouchersResponseSchema = z
  .object({
    traceId: z.string().uuid(),
    isSuccess: z.boolean(),
    data: issueVouchersResponseDataSchema.optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough()

// ========== Exported Types ==========

// Request types
export type PassengerAddressData = z.infer<typeof passengerAddressDataSchema>
export type PassengerAddon = z.infer<typeof passengerAddonSchema>
export type IssuePassenger = z.infer<typeof issuePassengerSchema>
export type PaymentDetails = z.infer<typeof paymentDetailsSchema>
export type IssueVouchersRequest = z.infer<typeof issueVouchersRequestSchema>

// Response types
export type VoucherAddonAmount = z.infer<typeof voucherAddonAmountSchema>
export type VoucherAmountRate = z.infer<typeof voucherAmountRateSchema>
export type Voucher = z.infer<typeof voucherSchema>
export type PaymentAmountRate = z.infer<typeof paymentAmountRateSchema>
export type PaymentDetailsResponse = z.infer<typeof paymentDetailsResponseSchema>
export type IssueVouchersResponseData = z.infer<typeof issueVouchersResponseDataSchema>
export type IssueVouchersResponse = z.infer<typeof issueVouchersResponseSchema>
