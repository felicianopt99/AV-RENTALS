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

  // Create sample categories
  const audioCategory = await prisma.category.upsert({
    where: { id: 'cat1' },
    update: {},
    create: {
      id: 'cat1',
      name: 'Audio',
      icon: 'Mic',
    },
  })

  const videoCategory = await prisma.category.upsert({
    where: { id: 'cat2' },
    update: {},
    create: {
      id: 'cat2',
      name: 'Video',
      icon: 'Videotape',
    },
  })

  const lightingCategory = await prisma.category.upsert({
    where: { id: 'cat3' },
    update: {},
    create: {
      id: 'cat3',
      name: 'Lighting',
      icon: 'Zap',
    },
  })

  const stagingCategory = await prisma.category.upsert({
    where: { id: 'cat4' },
    update: {},
    create: {
      id: 'cat4',
      name: 'Staging',
      icon: 'Cuboid',
    },
  })

  // Create sample subcategories
  const microphonesSubcat = await prisma.subcategory.upsert({
    where: { id: 'subcat1_1' },
    update: {},
    create: {
      id: 'subcat1_1',
      name: 'Microphones',
      parentId: 'cat1',
    },
  })

  const speakersSubcat = await prisma.subcategory.upsert({
    where: { id: 'subcat1_2' },
    update: {},
    create: {
      id: 'subcat1_2',
      name: 'Speakers',
      parentId: 'cat1',
    },
  })

  const projectorsSubcat = await prisma.subcategory.upsert({
    where: { id: 'subcat2_1' },
    update: {},
    create: {
      id: 'subcat2_1',
      name: 'Projectors',
      parentId: 'cat2',
    },
  })

  const ledParsSubcat = await prisma.subcategory.upsert({
    where: { id: 'subcat3_1' },
    update: {},
    create: {
      id: 'subcat3_1',
      name: 'LED Pars',
      parentId: 'cat3',
    },
  })

  const platformsSubcat = await prisma.subcategory.upsert({
    where: { id: 'subcat4_1' },
    update: {},
    create: {
      id: 'subcat4_1',
      name: 'Platforms',
      parentId: 'cat4',
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('📊 Created:')
  console.log(`   - 1 Admin User (${adminUser.username})`)
  console.log(`   - ${await prisma.category.count()} Categories`)
  console.log(`   - ${await prisma.subcategory.count()} Subcategories`)
  console.log('🎯 Database is clean and ready for production!')
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
