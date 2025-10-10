import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash default passwords
  const defaultPassword = await bcrypt.hash('password123', 12)

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

  const managerUser = await prisma.user.upsert({
    where: { id: 'user2' },
    update: {},
    create: {
      id: 'user2',
      name: 'Manager User',
      username: 'manager',
      password: defaultPassword,
      role: 'Manager',
    },
  })

  const techUser = await prisma.user.upsert({
    where: { id: 'user3' },
    update: {},
    create: {
      id: 'user3',
      name: 'Technician User',
      username: 'technician',
      password: defaultPassword,
      role: 'Technician',
    },
  })

  const employeeUser = await prisma.user.upsert({
    where: { id: 'user4' },
    update: {},
    create: {
      id: 'user4',
      name: 'Employee User',
      username: 'employee',
      password: defaultPassword,
      role: 'Employee',
    },
  })

  const viewerUser = await prisma.user.upsert({
    where: { id: 'user5' },
    update: {},
    create: {
      id: 'user5',
      name: 'Viewer User',
      username: 'viewer',
      password: defaultPassword,
      role: 'Viewer',
    },
  })

  // Create Categories
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

  // Create Subcategories
  await prisma.subcategory.upsert({
    where: { id: 'subcat1_1' },
    update: {},
    create: {
      id: 'subcat1_1',
      name: 'Microphones',
      parentId: 'cat1',
    },
  })

  await prisma.subcategory.upsert({
    where: { id: 'subcat1_2' },
    update: {},
    create: {
      id: 'subcat1_2',
      name: 'Speakers',
      parentId: 'cat1',
    },
  })

  await prisma.subcategory.upsert({
    where: { id: 'subcat2_1' },
    update: {},
    create: {
      id: 'subcat2_1',
      name: 'Projectors',
      parentId: 'cat2',
    },
  })

  // Create Sample Equipment
  await prisma.equipmentItem.upsert({
    where: { id: 'eq1' },
    update: {},
    create: {
      id: 'eq1',
      name: 'Shure SM58',
      description: 'Dynamic Vocal Microphone, industry standard for live vocals and speech.',
      categoryId: 'cat1',
      subcategoryId: 'subcat1_1',
      quantity: 10,
      status: 'good',
      location: 'Shelf A1',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 15.00,
      type: 'equipment',
    },
  })

  await prisma.equipmentItem.upsert({
    where: { id: 'eq2' },
    update: {},
    create: {
      id: 'eq2',
      name: 'JBL EON615',
      description: 'Portable Powered Speaker with Bluetooth, perfect for events up to 150 people.',
      categoryId: 'cat1',
      subcategoryId: 'subcat1_2',
      quantity: 8,
      status: 'good',
      location: 'Storage Room B',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 45.00,
      type: 'equipment',
    },
  })

  // Create Sample Client
  const client = await prisma.client.upsert({
    where: { id: 'client1' },
    update: {},
    create: {
      id: 'client1',
      name: 'Local Community Center',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@community-center.org',
      phone: '+1234567890',
      address: '123 Main Street, Your City',
      notes: 'Regular client, always pays on time.',
    },
  })

  // Create Sample Event
  const event = await prisma.event.upsert({
    where: { id: 'event1' },
    update: {},
    create: {
      id: 'event1',
      name: 'Annual Charity Gala',
      clientId: client.id,
      location: 'Grand Ballroom',
      startDate: new Date('2025-11-15T18:00:00Z'),
      endDate: new Date('2025-11-15T23:00:00Z'),
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