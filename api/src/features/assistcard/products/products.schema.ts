import { z } from 'zod'

// ========== Date & Code Validators ==========

export const dateStringSchema = z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, {
  message: 'Date must be in YYYY/MM/DD format',
})

export const iataCodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/, {
  message: 'IATA code must be 3 uppercase letters',
})

export const countryCodeSchema = z.string().length(2).regex(/^[A-Z]{2}$/, {
  message: 'Country code must be ISO 3166-1 alpha-2 (e.g., AR, US)',
})

// ========== Request Schemas ==========

export const quotePassengerSchema = z.object({
  countryCode: countryCodeSchema,
  birthDate: dateStringSchema,
})

export const quoteItinerarySchema = z.object({
  code: z.literal('AIRPORT'),
  origin: iataCodeSchema,
  destination: iataCodeSchema,
})

export const quotePriceModifiersSchema = z.object({
  promotionalCode: z.string().optional(),
  markup: z.number().optional(),
  comissionDiscount: z.number().optional(),
})

export const quoteProductRequestSchema = z.object({
  // Point Emisor (from env vars, auto-injected)
  countryCode: countryCodeSchema,
  agencyCode: z.string().max(5),
  branchCode: z.number().int().min(0).max(999),

  // Travel parameters
  beginDate: dateStringSchema,
  endDate: dateStringSchema,
  itinerary: quoteItinerarySchema,
  passengers: z.array(quotePassengerSchema).min(1).max(16),

  // Optional filters
  travelType: z.number().int().min(1).max(2).optional(), // 1=Daily, 2=MultiTrip
  quoteAnnual: z.boolean().nullable().optional(),
  multiTripModalityFilter: z.array(z.string()).nullable().optional(),
  paymentMethod: z.enum(['CreditCard', 'CheckingAccount']).optional(),
  language: z.enum(['es', 'pt', 'en']).optional(),

  // Price modifiers
  priceModifiers: quotePriceModifiersSchema.optional(),
})

// ========== Response Schemas ==========

export const quotedProductAmountSchema = z.object({
  totalOriginal: z.number(),
  total: z.number(),
  totalNoTaxesIncluded: z.number(),
  subtotalAssistance: z.number(),
  subtotalInsurance: z.number(),
})

export const promotionalOfferSchema = z.object({
  code: z.string(),
  description: z.string(),
  percentage: z.string(),
})

export const quotedProductSchema = z.object({
  productCode: z.string(),
  rateCode: z.string(),
  name: z.string(),
  description: z.string(),
  rateCaption: z.string(),
  passengersURL: z.string().url().optional(),
  currency: z.string(),
  modality: z.string(),
  modalityCode: z.string(),
  allowMarkup: z.boolean(),
  promotionalOffer: promotionalOfferSchema.nullable().optional(),
  amount: quotedProductAmountSchema,
})

export const quoteProductResponseDataSchema = z.object({
  destinationArea: z.string(),
  exchangeRate: z.number(),
  processingFee: z.number(),
  quotedProducts: z.array(quotedProductSchema),
})

export const quoteProductResponseSchema = z
  .object({
    traceId: z.string().uuid(),
    isSuccess: z.boolean(),
    data: quoteProductResponseDataSchema.optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough() // Allow extra fields from API

// ========== Quote Addons Schemas ==========

export const quoteAddonsRequestSchema = z.object({
  // Point Emisor (from env vars, auto-injected)
  countryCode: countryCodeSchema,
  agencyCode: z.string().max(5),
  branchCode: z.number().int().min(0).max(999),

  // Coverage dates
  beginDate: dateStringSchema,
  endDate: dateStringSchema,

  // Selected product (from Step 2)
  productCode: z.string(),
  rateCode: z.string(),

  // Passengers (same as products)
  passengers: z.array(quotePassengerSchema).min(1).max(16),

  // Optional
  language: z.enum(['es', 'pt', 'en']).optional(),
})

export const allowedPassengerSchema = z.object({
  birthDate: dateStringSchema,
})

export const addonCategoryAmountSchema = z.object({
  totalOriginal: z.number(),
  total: z.number(),
  subtotalAssistance: z.number(),
  subtotalInsurance: z.number(),
})

export const addonCategorySchema = z.object({
  rateCode: z.string(),
  rateCategory: z.number(), // Coverage amount (e.g., 50000 = USD 50,000)
  currency: z.string(),
  allowedPassengers: z.array(allowedPassengerSchema),
  amount: addonCategoryAmountSchema,
})

export const quotedAddonSchema = z.object({
  productCode: z.string(),
  name: z.string(),
  description: z.string(),
  categories: z.array(addonCategorySchema),
})

export const quoteAddonsResponseDataSchema = z.object({
  quotedAddons: z.array(quotedAddonSchema),
})

export const quoteAddonsResponseSchema = z
  .object({
    traceId: z.string().uuid(),
    isSuccess: z.boolean(),
    data: quoteAddonsResponseDataSchema.optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough()

// ========== Error Response ==========

export const assistcardErrorSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    traceId: z.string().uuid(),
    isSuccess: z.literal(false),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough()

// ========== Exported Types ==========

// Shared types
export type QuotePassenger = z.infer<typeof quotePassengerSchema>
export type QuoteItinerary = z.infer<typeof quoteItinerarySchema>
export type QuotePriceModifiers = z.infer<typeof quotePriceModifiersSchema>
export type AssistcardError = z.infer<typeof assistcardErrorSchema>

// Products types
export type QuoteProductRequest = z.infer<typeof quoteProductRequestSchema>
export type QuotedProductAmount = z.infer<typeof quotedProductAmountSchema>
export type PromotionalOffer = z.infer<typeof promotionalOfferSchema>
export type QuotedProduct = z.infer<typeof quotedProductSchema>
export type QuoteProductResponseData = z.infer<typeof quoteProductResponseDataSchema>
export type QuoteProductResponse = z.infer<typeof quoteProductResponseSchema>

// Addons types
export type QuoteAddonsRequest = z.infer<typeof quoteAddonsRequestSchema>
export type AllowedPassenger = z.infer<typeof allowedPassengerSchema>
export type AddonCategoryAmount = z.infer<typeof addonCategoryAmountSchema>
export type AddonCategory = z.infer<typeof addonCategorySchema>
export type QuotedAddon = z.infer<typeof quotedAddonSchema>
export type QuoteAddonsResponseData = z.infer<typeof quoteAddonsResponseDataSchema>
export type QuoteAddonsResponse = z.infer<typeof quoteAddonsResponseSchema>
