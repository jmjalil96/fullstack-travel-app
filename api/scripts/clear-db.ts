import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.info('🗑️  Deleting all records...')

  // Delete in order to respect foreign key constraints
  await prisma.auditLog.deleteMany()
  console.info('✓ AuditLog cleared')

  await prisma.commission.deleteMany()
  console.info('✓ Commission cleared')

  await prisma.agent.deleteMany()
  console.info('✓ Agent cleared')

  await prisma.policy.deleteMany()
  console.info('✓ Policy cleared')

  await prisma.quote.deleteMany()
  console.info('✓ Quote cleared')

  await prisma.passenger.deleteMany()
  console.info('✓ Passenger cleared')

  await prisma.rolePermission.deleteMany()
  console.info('✓ RolePermission cleared')

  await prisma.permission.deleteMany()
  console.info('✓ Permission cleared')

  await prisma.profile.deleteMany()
  console.info('✓ Profile cleared')

  await prisma.role.deleteMany()
  console.info('✓ Role cleared')

  await prisma.session.deleteMany()
  console.info('✓ Session cleared')

  await prisma.verification.deleteMany()
  console.info('✓ Verification cleared')

  await prisma.account.deleteMany()
  console.info('✓ Account cleared')

  await prisma.user.deleteMany()
  console.info('✓ User cleared')

  console.info('\n✅ All records deleted successfully')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
