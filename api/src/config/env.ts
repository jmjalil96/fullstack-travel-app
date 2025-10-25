import dotenv from 'dotenv'
import { z } from 'zod'

// Load .env file
dotenv.config()

// Define the schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CLIENT_URL: z.string().url().default('http://localhost:5174'),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform(val => val.split(',').map(origin => origin.trim())),

  // Assistcard API
  ASSISTCARD_USE_MOCK: z
    .string()
    .default('false')
    .transform(val => val === 'true'),
  ASSISTCARD_API_URL: z.string().url().optional(),
  ASSISTCARD_COUNTRY_CODE: z.string().length(2).optional(),
  ASSISTCARD_AGENCY_CODE: z.string().max(5).optional(),
  ASSISTCARD_BRANCH_CODE: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined)),
  // Note: USERNAME and PASSWORD accessed via process.env (not validated here for security)
})

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.issues.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

// Export validated and typed environment config
export const env = parseEnv()

// Export type for use in other parts of the application
export type Env = typeof env
