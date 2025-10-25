import { env } from '../../../config/env.js'

import {
  quoteProducts as quoteProductsMock,
  quoteAddons as quoteAddonsMock,
} from './products.mock.js'
import {
  quoteProducts as quoteProductsReal,
  quoteAddons as quoteAddonsReal,
} from './products.service.js'

/**
 * Quote Products service - automatically switches between real and mock based on env
 */
export const quoteProducts = env.ASSISTCARD_USE_MOCK ? quoteProductsMock : quoteProductsReal

/**
 * Quote Addons service - automatically switches between real and mock based on env
 */
export const quoteAddons = env.ASSISTCARD_USE_MOCK ? quoteAddonsMock : quoteAddonsReal

// Re-export types, schemas, and routes
export * from './products.schema.js'
export * from './products.errors.js'
export * from './products.routes.js'
export type {
  QuoteProductRequest,
  QuoteProductResponseData,
  QuoteAddonsRequest,
  QuoteAddonsResponseData,
} from './products.schema.js'
