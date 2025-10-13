import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🔄 Resetting database... Keeping users and customization settings.')

  try {
    await prisma.$transaction(async (tx) => {
      // Delete in order to respect foreign keys
      await tx.notification.deleteMany()
      await tx.dataSyncEvent.deleteMany()
      await tx.activityLog.deleteMany()
      await tx.userSession.deleteMany()
      await tx.quoteItem.deleteMany()
      await tx.quote.deleteMany()
      await tx.rental.deleteMany()
      await tx.event.deleteMany()
      await tx.client.deleteMany()
      await tx.maintenanceLog.deleteMany()
      await tx.equipmentItem.deleteMany()
      await tx.subcategory.deleteMany()
      await tx.category.deleteMany()
    })

    console.log('✅ Database reset successfully! Users and customization settings preserved.')
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    throw error
  }
}

resetDatabase()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
