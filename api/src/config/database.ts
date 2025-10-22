import { PrismaClient } from '@prisma/client'

import { env } from './env.js'

/**
 * Prisma Client singleton instance
 * - Query logging in development
 * - Single instance across the application
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export const db = globalThis.prismaGlobal ?? prismaClientSingleton()

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db
}

/**
 * Gracefully disconnect from database
 * Call this on server shutdown
 */
export const disconnectDatabase = async () => {
  await db.$disconnect()
}
