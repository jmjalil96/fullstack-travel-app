import { randomUUID } from 'node:crypto'

import { logger } from '../../../shared/middleware/logger.js'

import type {
  QuoteProductRequest,
  QuoteProductResponseData,
  QuoteAddonsRequest,
  QuoteAddonsResponseData,
} from './products.schema.js'

/**
 * Mock implementation of Assistcard Quote Products API
 * Returns realistic sample data for development/testing without API credentials
 */
export async function quoteProducts(
  params: Omit<QuoteProductRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  _authToken: string
): Promise<QuoteProductResponseData> {
  logger.info(
    {
      origin: params.itinerary.origin,
      destination: params.itinerary.destination,
      passengersCount: params.passengers.length,
    },
    '🎭 Using MOCK Assistcard Products API'
  )

  // Calculate trip duration
  const beginDate = new Date(params.beginDate.replace(/\//g, '-'))
  const endDate = new Date(params.endDate.replace(/\//g, '-'))
  const duration = Math.ceil((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Base pricing per day per passenger
  const basePricePerDay = 25
  const passengerCount = params.passengers.length

  // Check for promotional code
  const hasPromo = !!params.priceModifiers?.promotionalCode
  const promoDiscount = hasPromo ? 0.15 : 0 // 15% discount

  // Generate mock products with varying coverage levels
  const products = [
    {
      productCode: 'AC',
      rateCode: '150',
      name: 'AC 150',
      description: 'Cobertura estándar para viajes internacionales',
      rateCaption: 'Gastos médicos USD 150,000 | Equipaje USD 1,200 | Asistencia 24/7',
      passengersURL: `https://www.assistcard.com/ar/quote/${randomUUID()}`,
      currency: 'USD',
      modality: 'Daily',
      modalityCode: 'D',
      allowMarkup: false,
      promotionalOffer: hasPromo && params.priceModifiers?.promotionalCode
        ? {
            code: params.priceModifiers.promotionalCode,
            description: 'Descuento promocional',
            percentage: '15%',
          }
        : null,
      amount: {
        totalOriginal: duration * passengerCount * basePricePerDay,
        total: duration * passengerCount * basePricePerDay * (1 - promoDiscount),
        totalNoTaxesIncluded: duration * passengerCount * basePricePerDay * (1 - promoDiscount),
        subtotalAssistance: duration * passengerCount * basePricePerDay * 0.7 * (1 - promoDiscount),
        subtotalInsurance: duration * passengerCount * basePricePerDay * 0.3 * (1 - promoDiscount),
      },
    },
    {
      productCode: 'AC',
      rateCode: '250',
      name: 'AC 250',
      description: 'Cobertura premium con mayor protección',
      rateCaption: 'Gastos médicos USD 250,000 | Equipaje USD 2,000 | Asistencia 24/7',
      passengersURL: `https://www.assistcard.com/ar/quote/${randomUUID()}`,
      currency: 'USD',
      modality: 'Daily',
      modalityCode: 'D',
      allowMarkup: false,
      promotionalOffer: null,
      amount: {
        totalOriginal: duration * passengerCount * basePricePerDay * 1.5,
        total: duration * passengerCount * basePricePerDay * 1.5,
        totalNoTaxesIncluded: duration * passengerCount * basePricePerDay * 1.5,
        subtotalAssistance: duration * passengerCount * basePricePerDay * 1.5 * 0.7,
        subtotalInsurance: duration * passengerCount * basePricePerDay * 1.5 * 0.3,
      },
    },
    {
      productCode: 'AC',
      rateCode: '350',
      name: 'AC 350',
      description: 'Cobertura completa con máxima protección',
      rateCaption: 'Gastos médicos USD 350,000 | Equipaje USD 3,000 | Asistencia 24/7 Premium',
      passengersURL: `https://www.assistcard.com/ar/quote/${randomUUID()}`,
      currency: 'USD',
      modality: 'Daily',
      modalityCode: 'D',
      allowMarkup: true,
      promotionalOffer: null,
      amount: {
        totalOriginal: duration * passengerCount * basePricePerDay * 2,
        total: duration * passengerCount * basePricePerDay * 2,
        totalNoTaxesIncluded: duration * passengerCount * basePricePerDay * 2,
        subtotalAssistance: duration * passengerCount * basePricePerDay * 2 * 0.7,
        subtotalInsurance: duration * passengerCount * basePricePerDay * 2 * 0.3,
      },
    },
  ]

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  logger.info(
    {
      productsCount: products.length,
      duration,
      passengerCount,
      hasPromo,
    },
    '🎭 Mock API returned products successfully'
  )

  return {
    destinationArea: params.itinerary.destination === 'MIA' ? 'USA' : 'International',
    exchangeRate: 1050.5,
    processingFee: 2.5,
    quotedProducts: products,
  }
}

/**
 * Mock implementation of Assistcard Quote Addons API
 * Returns realistic optional coverage addons
 */
export async function quoteAddons(
  params: Omit<QuoteAddonsRequest, 'countryCode' | 'agencyCode' | 'branchCode'>,
  _authToken: string
): Promise<QuoteAddonsResponseData> {
  logger.info(
    {
      productCode: params.productCode,
      rateCode: params.rateCode,
      passengersCount: params.passengers.length,
    },
    '🎭 Using MOCK Assistcard Addons API'
  )

  // Calculate trip duration
  const beginDate = new Date(params.beginDate.replace(/\//g, '-'))
  const endDate = new Date(params.endDate.replace(/\//g, '-'))
  const duration = Math.ceil((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Calculate ages for restrictions
  const passengersWithAge = params.passengers.map(p => {
    const birthDate = new Date(p.birthDate.replace(/\//g, '-'))
    const age = Math.floor((beginDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    return { ...p, age }
  })

  // Filter allowed passengers for sports (exclude 70+)
  const allowedForSports = passengersWithAge
    .filter(p => p.age < 70)
    .map(p => ({ birthDate: p.birthDate }))

  // Generate mock addons
  const addons = [
    {
      productCode: 'COVID',
      name: 'Cobertura COVID-19',
      description: 'Cobertura adicional para gastos médicos relacionados con COVID-19',
      categories: [
        {
          rateCode: 'COVID_BASIC',
          rateCategory: 50000,
          currency: 'USD',
          allowedPassengers: params.passengers.map(p => ({ birthDate: p.birthDate })),
          amount: {
            totalOriginal: duration * 5,
            total: duration * 5,
            subtotalAssistance: duration * 4,
            subtotalInsurance: duration * 1,
          },
        },
        {
          rateCode: 'COVID_PREMIUM',
          rateCategory: 100000,
          currency: 'USD',
          allowedPassengers: params.passengers.map(p => ({ birthDate: p.birthDate })),
          amount: {
            totalOriginal: duration * 8,
            total: duration * 8,
            subtotalAssistance: duration * 6.5,
            subtotalInsurance: duration * 1.5,
          },
        },
      ],
    },
    {
      productCode: 'SPORTS',
      name: 'Cobertura Deportes Extremos',
      description: 'Protección para actividades deportivas de alto riesgo (no disponible para mayores de 70 años)',
      categories: [
        {
          rateCode: 'SPORTS_STANDARD',
          rateCategory: 25000,
          currency: 'USD',
          allowedPassengers: allowedForSports, // Age restricted
          amount: {
            totalOriginal: duration * 3,
            total: duration * 3,
            subtotalAssistance: duration * 2.5,
            subtotalInsurance: duration * 0.5,
          },
        },
      ],
    },
    {
      productCode: 'CANCEL',
      name: 'Cancelación de Viaje',
      description: 'Reembolso por cancelación de viaje por causas justificadas',
      categories: [
        {
          rateCode: 'CANCEL_FULL',
          rateCategory: 5000,
          currency: 'USD',
          allowedPassengers: params.passengers.map(p => ({ birthDate: p.birthDate })),
          amount: {
            totalOriginal: duration * 6,
            total: duration * 6,
            subtotalAssistance: duration * 5,
            subtotalInsurance: duration * 1,
          },
        },
      ],
    },
  ]

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  logger.info(
    {
      addonsCount: addons.length,
      totalCategories: addons.reduce((sum, addon) => sum + addon.categories.length, 0),
      duration,
    },
    '🎭 Mock API returned addons successfully'
  )

  return {
    quotedAddons: addons,
  }
}
