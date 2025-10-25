import { logger } from '../../../shared/middleware/logger.js'

import { createAssistcardApiError, AssistcardApiError } from './products.errors.js'
import {
  quoteProductRequestSchema,
  quoteProductResponseSchema,
  quoteAddonsRequestSchema,
  quoteAddonsResponseSchema,
} from './products.schema.js'
import type {
  QuoteProductRequest,
  QuoteProductResponseData,
  QuoteAddonsRequest,
  QuoteAddonsResponseData,
} from './products.schema.js'

/**
 * Call Assistcard Quote Products API to get available insurance products
 *
 * @param params - Quote parameters (without Point Emisor credentials)
 * @param authToken - Valid Assistcard bearer token
 * @returns Quote data with available products and pricing
 * @throws AssistcardProductError on API failure or network error
 *
 * @example
 * const products = await quoteProducts({
 *   beginDate: '2025/02/01',
 *   endDate: '2025/02/15',
 *   itinerary: { code: 'AIRPORT', origin: 'EZE', destination: 'MIA' },
 *   passengers: [{ countryCode: 'AR', birthDate: '1990/05/15' }]
 * }, token)
 */
export async function quoteProducts(
  params: Omit<QuoteProductRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  authToken: string
): Promise<QuoteProductResponseData> {
  // Validate environment variables
  const apiUrl = process.env.ASSISTCARD_API_URL
  if (!apiUrl) {
    throw new Error('ASSISTCARD_API_URL environment variable is not set')
  }

  // Inject Point Emisor credentials from environment
  const requestBody: QuoteProductRequest = {
    countryCode: process.env.ASSISTCARD_COUNTRY_CODE || '',
    agencyCode: process.env.ASSISTCARD_AGENCY_CODE || '',
    branchCode: parseInt(process.env.ASSISTCARD_BRANCH_CODE || '0'),
    ...params,
  }

  // Validate complete request payload
  const validatedRequest = quoteProductRequestSchema.parse(requestBody)

  logger.info(
    {
      origin: validatedRequest.itinerary.origin,
      destination: validatedRequest.itinerary.destination,
      passengersCount: validatedRequest.passengers.length,
      beginDate: validatedRequest.beginDate,
      endDate: validatedRequest.endDate,
    },
    'Calling Assistcard Quote Products API'
  )

  try {
    // Call Assistcard API
    const response = await fetch(`${apiUrl}/api/v1/Quote/product`, {
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
    const validatedResponse = quoteProductResponseSchema.parse(data)

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
        productsCount: validatedResponse.data.quotedProducts.length,
        destinationArea: validatedResponse.data.destinationArea,
        exchangeRate: validatedResponse.data.exchangeRate,
      },
      'Successfully retrieved products from Assistcard'
    )

    return validatedResponse.data
  } catch (error) {
    // Re-throw AssistcardApiError as-is (already logged)
    if (error instanceof AssistcardApiError) {
      throw error
    }

    // Handle network errors and unexpected failures
    logger.error({ error }, 'Failed to call Assistcard Quote Products API')

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

/**
 * Call Assistcard Quote Addons API to get optional coverage addons
 *
 * @param params - Addons parameters (without Point Emisor credentials)
 * @param authToken - Valid Assistcard bearer token
 * @returns Quote addons data with available coverage enhancements
 * @throws AssistcardApiError on API failure or network error
 *
 * @example
 * const addons = await quoteAddons({
 *   beginDate: '2025/02/01',
 *   endDate: '2025/02/15',
 *   productCode: 'AC',
 *   rateCode: '150',
 *   passengers: [{ countryCode: 'AR', birthDate: '1990/05/15' }]
 * }, token)
 */
export async function quoteAddons(
  params: Omit<QuoteAddonsRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  authToken: string
): Promise<QuoteAddonsResponseData> {
  // Validate environment variables
  const apiUrl = process.env.ASSISTCARD_API_URL
  if (!apiUrl) {
    throw new Error('ASSISTCARD_API_URL environment variable is not set')
  }

  // Inject Point Emisor credentials from environment
  const requestBody: QuoteAddonsRequest = {
    countryCode: process.env.ASSISTCARD_COUNTRY_CODE || '',
    agencyCode: process.env.ASSISTCARD_AGENCY_CODE || '',
    branchCode: parseInt(process.env.ASSISTCARD_BRANCH_CODE || '0'),
    ...params,
  }

  // Validate complete request payload
  const validatedRequest = quoteAddonsRequestSchema.parse(requestBody)

  logger.info(
    {
      productCode: validatedRequest.productCode,
      rateCode: validatedRequest.rateCode,
      passengersCount: validatedRequest.passengers.length,
      beginDate: validatedRequest.beginDate,
      endDate: validatedRequest.endDate,
    },
    'Calling Assistcard Quote Addons API'
  )

  try {
    // Call Assistcard API
    const response = await fetch(`${apiUrl}/api/v1/Quote/addons`, {
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
    const validatedResponse = quoteAddonsResponseSchema.parse(data)

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
        addonsCount: validatedResponse.data.quotedAddons.length,
        totalCategories: validatedResponse.data.quotedAddons.reduce(
          (sum, addon) => sum + addon.categories.length,
          0
        ),
      },
      'Successfully retrieved addons from Assistcard'
    )

    return validatedResponse.data
  } catch (error) {
    // Re-throw AssistcardApiError as-is (already logged)
    if (error instanceof AssistcardApiError) {
      throw error
    }

    // Handle network errors and unexpected failures
    logger.error({ error }, 'Failed to call Assistcard Quote Addons API')

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
