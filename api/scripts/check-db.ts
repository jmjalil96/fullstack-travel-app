import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const quotes = await prisma.quote.count()
  const passengers = await prisma.passenger.count()
  const policies = await prisma.policy.count()

  console.info('📊 Database Records:')
  console.info(`   Quotes: ${quotes}`)
  console.info(`   Passengers: ${passengers}`)
  console.info(`   Policies: ${policies}`)

  console.info('\n📝 Latest Policy:')
  const latestPolicy = await prisma.policy.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { passenger: true, quote: true },
  })

  if (latestPolicy) {
    console.info(`   Voucher: ${latestPolicy.voucherCode}`)
    console.info(`   Passenger: ${latestPolicy.passenger.firstName} ${latestPolicy.passenger.lastName}`)
    console.info(`   Product: ${latestPolicy.productName}`)
    console.info(`   Amount: $${latestPolicy.totalAmount}`)
    console.info(`   Group: ${latestPolicy.voucherGroup}`)
    console.info(`   Quote: ${latestPolicy.quote.origin} → ${latestPolicy.quote.destination}`)
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
