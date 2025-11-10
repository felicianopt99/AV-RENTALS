import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Log created clients
  const allClients = await prisma.client.findMany();
  console.log('Clients:', allClients);

  // Log created equipment items
  const allEquipment = await prisma.equipmentItem.findMany();
  console.log('Equipment Items:', allEquipment);
  console.log('🌱 Seeding database...')

  // Hash default passwords
  const defaultPassword = await bcrypt.hash('admin', 12)

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

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { id: 'client1' },
    update: {},
    create: {
      id: 'client1',
      name: 'Acme Events',
      contactPerson: 'Alice Smith',
      email: 'alice@acme.com',
      phone: '+1234567890',
      address: '123 Main St, Cityville',
      notes: 'VIP client',
    },
  })
  const client2 = await prisma.client.upsert({
    where: { id: 'client2' },
    update: {},
    create: {
      id: 'client2',
      name: 'Bravo Productions',
      contactPerson: 'Bob Johnson',
      email: 'bob@bravo.com',
      phone: '+1987654321',
      address: '456 Side Rd, Townsville',
      notes: '',
    },
  })
  const client3 = await prisma.client.upsert({
    where: { id: 'client3' },
    update: {},
    create: {
      id: 'client3',
      name: 'Charlie Rentals',
      contactPerson: 'Charlie Lee',
      email: 'charlie@rentals.com',
      phone: '+1122334455',
      address: '789 Broadway, Metropolis',
      notes: 'Prefers email contact',
    },
  })

  // Create sample equipment items
  const mic1 = await prisma.equipmentItem.upsert({
    where: { id: 'eq1' },
    update: {},
    create: {
      id: 'eq1',
      name: 'Shure SM58 Microphone',
      description: 'Dynamic vocal microphone',
      categoryId: 'cat1',
      subcategoryId: 'subcat1_1',
      quantity: 10,
      status: 'good',
      location: 'Warehouse A',
      imageUrl: null,
      dailyRate: 8.5,
      type: 'equipment',
    },
  })
  const speaker1 = await prisma.equipmentItem.upsert({
    where: { id: 'eq2' },
    update: {},
    create: {
      id: 'eq2',
      name: 'QSC K12 Speaker',
      description: '12-inch powered speaker',
      categoryId: 'cat1',
      subcategoryId: 'subcat1_2',
      quantity: 6,
      status: 'good',
      location: 'Warehouse B',
      imageUrl: null,
      dailyRate: 25,
      type: 'equipment',
    },
  })
  const projector1 = await prisma.equipmentItem.upsert({
    where: { id: 'eq3' },
    update: {},
    create: {
      id: 'eq3',
      name: 'Epson EB-X41 Projector',
      description: 'LCD projector, 3600 lumens',
      categoryId: 'cat2',
      subcategoryId: 'subcat2_1',
      quantity: 3,
      status: 'good',
      location: 'Warehouse A',
      imageUrl: null,
      dailyRate: 30,
      type: 'equipment',
    },
  })
  const ledPar1 = await prisma.equipmentItem.upsert({
    where: { id: 'eq4' },
    update: {},
    create: {
      id: 'eq4',
      name: 'Chauvet DJ SlimPAR 64',
      description: 'LED PAR can light',
      categoryId: 'cat3',
      subcategoryId: 'subcat3_1',
      quantity: 12,
      status: 'good',
      location: 'Warehouse C',
      imageUrl: null,
      dailyRate: 7,
      type: 'equipment',
    },
  })


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

  // Create sample services
  const setupService = await prisma.service.upsert({
    where: { id: 'svc1' },
    update: {},
    create: {
      id: 'svc1',
      name: 'Setup & Teardown',
      description: 'Professional setup and teardown of AV equipment.',
      unitPrice: 100,
      unit: 'event',
      category: 'Setup',
      isActive: true,
    },
  });
  const techSupportService = await prisma.service.upsert({
    where: { id: 'svc2' },
    update: {},
    create: {
      id: 'svc2',
      name: 'On-site Technical Support',
      description: 'Technician available during event hours.',
      unitPrice: 40,
      unit: 'hour',
      category: 'Technical Support',
      isActive: true,
    },
  });
  // Create sample fees
  const deliveryFee = await prisma.fee.upsert({
    where: { id: 'fee1' },
    update: {},
    create: {
      id: 'fee1',
      name: 'Delivery Fee',
      description: 'Covers transport of equipment to venue.',
      amount: 50,
      type: 'fixed',
      category: 'Delivery',
      isActive: true,
      isRequired: false,
    },
  });
  const insuranceFee = await prisma.fee.upsert({
    where: { id: 'fee2' },
    update: {},
    create: {
      id: 'fee2',
      name: 'Insurance',
      description: 'Event insurance (percentage of subtotal).',
      amount: 5,
      type: 'percentage',
      category: 'Insurance',
      isActive: true,
      isRequired: false,
    },
  });

  // Create sample quotes
  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'Q-1001',
      name: 'Corporate Conference',
      location: 'Grand Hyatt Ballroom',
      clientId: client1.id,
      clientName: client1.name,
      clientEmail: client1.email,
      clientPhone: client1.phone,
      clientAddress: client1.address,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-03'),
      subTotal: 300,
      discountAmount: 20,
      discountType: 'fixed',
      taxRate: 0.23,
      taxAmount: 64.4,
      totalAmount: 344.4,
      status: 'Sent',
      notes: 'Main annual event',
      items: {
        create: [
          {

            type: 'equipment',
            equipmentId: mic1.id,
            equipmentName: mic1.name,
            quantity: 2,
            unitPrice: mic1.dailyRate,
            days: 3,
            lineTotal: 2 * mic1.dailyRate * 3,
          },
          {
            type: 'equipment',
            equipmentId: speaker1.id,
            equipmentName: speaker1.name,
            quantity: 2,
            unitPrice: speaker1.dailyRate,
            days: 3,
            lineTotal: 2 * speaker1.dailyRate * 3,
          },
          {
            type: 'service',
            serviceId: setupService.id,
            serviceName: setupService.name,
            quantity: 1,
            unitPrice: setupService.unitPrice,
            days: 1,
            lineTotal: setupService.unitPrice,
          },
          {
            type: 'fee',
            feeId: deliveryFee.id,
            feeName: deliveryFee.name,
            amount: deliveryFee.amount,
            feeType: deliveryFee.type,
            lineTotal: deliveryFee.amount,
          },
        ],
      },
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      quoteNumber: 'Q-1002',
      name: 'Wedding Reception',
      location: 'Sunset Gardens',
      clientId: client2.id,
      clientName: client2.name,
      clientEmail: client2.email,
      clientPhone: client2.phone,
      clientAddress: client2.address,
      startDate: new Date('2025-12-10'),
      endDate: new Date('2025-12-11'),
      subTotal: 200,
      discountAmount: 0,
      discountType: 'fixed',
      taxRate: 0.23,
      taxAmount: 46,
      totalAmount: 246,
      status: 'Draft',
      notes: 'Outdoor event',
      items: {
        create: [
          {

            type: 'equipment',
            equipmentId: ledPar1.id,
            equipmentName: ledPar1.name,
            quantity: 4,
            unitPrice: ledPar1.dailyRate,
            days: 2,
            lineTotal: 4 * ledPar1.dailyRate * 2,
          },
          {

            type: 'service',
            serviceId: techSupportService.id,
            serviceName: techSupportService.name,
            quantity: 5,
            unitPrice: techSupportService.unitPrice,
            days: 1,
            lineTotal: 5 * techSupportService.unitPrice,
          },
          {

            type: 'fee',
            feeId: insuranceFee.id,
            feeName: insuranceFee.name,
            amount: insuranceFee.amount,
            feeType: insuranceFee.type,
            lineTotal: 10,
          },
        ],
      },
    },
  });

  const quote3 = await prisma.quote.create({
    data: {
      quoteNumber: 'Q-1003',
      name: 'Product Launch',
      location: 'City Expo Center',
      clientId: client3.id,
      clientName: client3.name,
      clientEmail: client3.email,
      clientPhone: client3.phone,
      clientAddress: client3.address,
      startDate: new Date('2025-12-15'),
      endDate: new Date('2025-12-16'),
      subTotal: 150,
      discountAmount: 10,
      discountType: 'percentage',
      taxRate: 0.23,
      taxAmount: 32.2,
      totalAmount: 172.2,
      status: 'Accepted',
      notes: 'Tech company launch',
      items: {
        create: [
          {
            type: 'equipment',
            equipmentId: projector1.id,
            equipmentName: projector1.name,
            quantity: 1,
            unitPrice: projector1.dailyRate,
            days: 2,
            lineTotal: 1 * projector1.dailyRate * 2,
          },
          {
            type: 'service',
            serviceId: setupService.id,
            serviceName: setupService.name,
            quantity: 1,
            unitPrice: setupService.unitPrice,
            days: 1,
            lineTotal: setupService.unitPrice,
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!')
  console.log('📊 Created:')
  console.log(`   - 1 Admin User (${adminUser.username})`)
  console.log(`   - ${await prisma.category.count()} Categories`)
  console.log(`   - ${await prisma.subcategory.count()} Subcategories`)
  console.log(`   - ${await prisma.service.count()} Services`)
  console.log(`   - ${await prisma.fee.count()} Fees`)
  console.log(`   - ${await prisma.client.count()} Clients`)
  console.log(`   - ${await prisma.equipmentItem.count()} Equipment Items`)
  console.log(`   - ${await prisma.quote.count()} Quotes`)
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
