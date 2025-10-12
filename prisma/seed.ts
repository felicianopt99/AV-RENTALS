import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash default passwords
  const defaultPassword = await bcrypt.hash('admin', 12)

  // Create Users with different roles
  const adminUser = await prisma.user.upsert({
    where: { id: 'user1' },
    update: {},
    create: {
      id: 'user1',
      name: 'Admin User',
      username: 'admin',
      password: defaultPassword,
      role: 'Admin',
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
