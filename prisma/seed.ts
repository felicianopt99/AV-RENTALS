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

  // Create sample equipment
  const shureSm58 = await prisma.equipmentItem.upsert({
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

  const yamahaDbr10 = await prisma.equipmentItem.upsert({
    where: { id: 'eq2' },
    update: {},
    create: {
      id: 'eq2',
      name: 'Yamaha DBR10',
      description: '10" Powered Speaker, 700W, versatile for small to medium events.',
      categoryId: 'cat1',
      subcategoryId: 'subcat1_2',
      quantity: 4,
      status: 'good',
      location: 'Shelf A2',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 45.00,
      type: 'equipment',
    },
  })

  const epsonProEx7260 = await prisma.equipmentItem.upsert({
    where: { id: 'eq3' },
    update: {},
    create: {
      id: 'eq3',
      name: 'Epson Pro EX7260',
      description: 'Wireless WXGA 3LCD Projector, 3600 lumens, suitable for presentations.',
      categoryId: 'cat2',
      subcategoryId: 'subcat2_1',
      quantity: 3,
      status: 'maintenance',
      location: 'Tech Bench',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 75.00,
      type: 'equipment',
    },
  })

  const chauvetDjSlimpar56 = await prisma.equipmentItem.upsert({
    where: { id: 'eq4' },
    update: {},
    create: {
      id: 'eq4',
      name: 'Chauvet DJ SlimPAR 56',
      description: 'LED PAR Can Light, RGB color mixing for uplighting and stage wash.',
      categoryId: 'cat3',
      subcategoryId: 'subcat3_1',
      quantity: 12,
      status: 'good',
      location: 'Shelf C1',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 10.00,
      type: 'equipment',
    },
  })

  const sonyAlphaA7iii = await prisma.equipmentItem.upsert({
    where: { id: 'eq5' },
    update: {},
    create: {
      id: 'eq5',
      name: 'Sony Alpha a7 III',
      description: 'Full-frame Mirrorless Camera, 4K video, excellent for event coverage.',
      categoryId: 'cat2',
      subcategoryId: null,
      quantity: 2,
      status: 'damaged',
      location: 'Repair Bin',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 120.00,
      type: 'equipment',
    },
  })

  // Additional equipment for testing notifications
  const jblEon615 = await prisma.equipmentItem.upsert({
    where: { id: 'eq6' },
    update: {},
    create: {
      id: 'eq6',
      name: 'JBL EON615',
      description: '15" Powered Speaker, 1000W, for larger events.',
      categoryId: 'cat1',
      subcategoryId: 'subcat1_2',
      quantity: 6,
      status: 'good',
      location: 'Shelf A3',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 55.00,
      type: 'equipment',
    },
  })

  const rolandVr4hd = await prisma.equipmentItem.upsert({
    where: { id: 'eq7' },
    update: {},
    create: {
      id: 'eq7',
      name: 'Roland VR-4HD',
      description: '4K AV Mixer, for professional video production.',
      categoryId: 'cat2',
      subcategoryId: 'subcat2_1',
      quantity: 2,
      status: 'maintenance',
      location: 'Tech Bench',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 150.00,
      type: 'equipment',
    },
  })

  const americanDjMegaHexBar = await prisma.equipmentItem.upsert({
    where: { id: 'eq8' },
    update: {},
    create: {
      id: 'eq8',
      name: 'American DJ Mega Hex Bar',
      description: 'Hex LED Bar, for stage lighting effects.',
      categoryId: 'cat3',
      subcategoryId: 'subcat3_1',
      quantity: 8,
      status: 'good',
      location: 'Shelf C2',
      imageUrl: 'https://placehold.co/600x400.png',
      dailyRate: 25.00,
      type: 'equipment',
    },
  })

  // Create sample clients
  const techSolutionsInc = await prisma.client.upsert({
    where: { id: 'client1' },
    update: {},
    create: {
      id: 'client1',
      name: 'Tech Solutions Inc.',
      contactPerson: 'Alice Wonderland',
      email: 'alice@techsolutions.example.com',
      phone: '555-0101',
      address: '123 Innovation Drive, Tech City',
      notes: 'Prefers morning deliveries. Key contact for larger events.',
    },
  })

  const creativeEventsCo = await prisma.client.upsert({
    where: { id: 'client2' },
    update: {},
    create: {
      id: 'client2',
      name: 'Creative Events Co.',
      contactPerson: 'Bob The Builder',
      email: 'bob@creativeevents.example.com',
      phone: '555-0202',
      address: '456 Artful Ave, Design District',
      notes: 'Requires detailed setup diagrams.',
    },
  })

  const localCommunityFest = await prisma.client.upsert({
    where: { id: 'client3' },
    update: {},
    create: {
      id: 'client3',
      name: 'Local Community Fest',
      contactPerson: 'Carol Danvers',
      email: 'carol.fest@community.example.org',
      phone: '555-0303',
      address: '789 Community Park, Townsville',
      notes: 'Annual festival, budget-conscious.',
    },
  })

  // Create sample events (past and future for testing)
  const event1 = await prisma.event.upsert({
    where: { id: 'event1' },
    update: {},
    create: {
      id: 'event1',
      name: 'Tech Solutions Annual Conference',
      clientId: 'client1',
      location: 'Conference Hall A',
      startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
      endDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      assignedTo: 'user1',
    },
  })

  const event2 = await prisma.event.upsert({
    where: { id: 'event2' },
    update: {},
    create: {
      id: 'event2',
      name: 'Creative Events Gala',
      clientId: 'client2',
      location: 'Hotel Ballroom',
      startDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 4)),
      assignedTo: 'user1',
    },
  })

  const event3 = await prisma.event.upsert({
    where: { id: 'event3' },
    update: {},
    create: {
      id: 'event3',
      name: 'Tech Solutions Product Launch',
      clientId: 'client1',
      location: 'Outdoor Stage',
      startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      assignedTo: 'user1',
    },
  })

  const event4 = await prisma.event.upsert({
    where: { id: 'event4' },
    update: {},
    create: {
      id: 'event4',
      name: 'Community Fest Opening Ceremony',
      clientId: 'client3',
      location: 'Main Stage',
      startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 12)),
      assignedTo: 'user1',
    },
  })

  const event5 = await prisma.event.upsert({
    where: { id: 'event5' },
    update: {},
    create: {
      id: 'event5',
      name: 'Creative Events Workshop',
      clientId: 'client2',
      location: 'Workshop Room 1',
      startDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 16)),
      assignedTo: 'user1',
    },
  })

  // Upcoming events for notifications
  const event6 = await prisma.event.upsert({
    where: { id: 'event6' },
    update: {},
    create: {
      id: 'event6',
      name: 'Morning Seminar',
      clientId: 'client1',
      location: 'Auditorium A',
      startDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      assignedTo: 'user1',
    },
  })

  const event7 = await prisma.event.upsert({
    where: { id: 'event7' },
    update: {},
    create: {
      id: 'event7',
      name: 'Afternoon Conference',
      clientId: 'client2',
      location: 'Conference Hall B',
      startDate: new Date(new Date().setDate(new Date().getDate() + 3)), // In 3 days
      endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      assignedTo: 'user1',
    },
  })

  const event8 = await prisma.event.upsert({
    where: { id: 'event8' },
    update: {},
    create: {
      id: 'event8',
      name: 'Evening Gala',
      clientId: 'client3',
      location: 'Ballroom',
      startDate: new Date(new Date().setDate(new Date().getDate() + 7)), // In a week
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      assignedTo: 'user1',
    },
  })

  // Events for conflict testing
  const event9 = await prisma.event.upsert({
    where: { id: 'event9' },
    update: {},
    create: {
      id: 'event9',
      name: 'Multi-Day Festival',
      clientId: 'client3',
      location: 'Outdoor Grounds',
      startDate: new Date(new Date().setDate(new Date().getDate() + 20)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 22)),
      assignedTo: 'user1',
    },
  })

  const event10 = await prisma.event.upsert({
    where: { id: 'event10' },
    update: {},
    create: {
      id: 'event10',
      name: 'Overlapping Event Test',
      clientId: 'client1',
      location: 'Room 101',
      startDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Same day as event6
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      assignedTo: 'user1',
    },
  })

  // Create sample rentals
  const rental1 = await prisma.rental.upsert({
    where: { id: 'rental1' },
    update: {},
    create: {
      id: 'rental1',
      eventId: 'event2',
      equipmentId: 'eq1',
      quantityRented: 5,
      prepStatus: 'pending',
    },
  })

  const rental2 = await prisma.rental.upsert({
    where: { id: 'rental2' },
    update: {},
    create: {
      id: 'rental2',
      eventId: 'event2',
      equipmentId: 'eq2',
      quantityRented: 2,
      prepStatus: 'checked-out',
    },
  })

  // Rentals for upcoming events
  const rental3 = await prisma.rental.upsert({
    where: { id: 'rental3' },
    update: {},
    create: {
      id: 'rental3',
      eventId: 'event6',
      equipmentId: 'eq1',
      quantityRented: 3,
      prepStatus: 'pending',
    },
  })

  const rental4 = await prisma.rental.upsert({
    where: { id: 'rental4' },
    update: {},
    create: {
      id: 'rental4',
      eventId: 'event10',
      equipmentId: 'eq1',
      quantityRented: 2,
      prepStatus: 'pending',
    },
  })

  // Additional rentals for conflict testing (same equipment, same day)
  const rental5 = await prisma.rental.upsert({
    where: { id: 'rental5' },
    update: {},
    create: {
      id: 'rental5',
      eventId: 'event6',
      equipmentId: 'eq6',
      quantityRented: 2,
      prepStatus: 'pending',
    },
  })

  const rental6 = await prisma.rental.upsert({
    where: { id: 'rental6' },
    update: {},
    create: {
      id: 'rental6',
      eventId: 'event10',
      equipmentId: 'eq6',
      quantityRented: 1,
      prepStatus: 'pending',
    },
  })

  // Rentals for other upcoming events
  const rental7 = await prisma.rental.upsert({
    where: { id: 'rental7' },
    update: {},
    create: {
      id: 'rental7',
      eventId: 'event7',
      equipmentId: 'eq4',
      quantityRented: 8,
      prepStatus: 'pending',
    },
  })

  const rental8 = await prisma.rental.upsert({
    where: { id: 'rental8' },
    update: {},
    create: {
      id: 'rental8',
      eventId: 'event8',
      equipmentId: 'eq8',
      quantityRented: 6,
      prepStatus: 'pending',
    },
  })

  // Create sample quotes
  const quote1 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q2024-001' },
    update: {},
    create: {
      id: 'quote1',
      quoteNumber: 'Q2024-001',
      name: 'Tech Solutions Conference Setup',
      location: 'Conference Hall A',
      clientId: 'client1',
      clientName: 'Tech Solutions Inc.',
      clientEmail: 'alice@techsolutions.example.com',
      startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
      endDate: new Date(new Date().setDate(new Date().getDate() - 8)),
      subTotal: 2250.00,
      discountAmount: 0,
      discountType: 'fixed',
      taxRate: 0.05,
      taxAmount: 112.50,
      totalAmount: 2362.50,
      status: 'Accepted',
      notes: 'Includes audio and video equipment for 200 attendees.',
    },
  })

  const quote2 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q2024-002' },
    update: {},
    create: {
      id: 'quote2',
      quoteNumber: 'Q2024-002',
      name: 'Creative Events Gala Package',
      location: 'Hotel Ballroom',
      clientId: 'client2',
      clientName: 'Creative Events Co.',
      clientEmail: 'bob@creativeevents.example.com',
      startDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 4)),
      subTotal: 1800.00,
      discountAmount: 180.00,
      discountType: 'fixed',
      taxRate: 0.05,
      taxAmount: 81.00,
      totalAmount: 1701.00,
      status: 'Sent',
      notes: 'Lighting and sound for evening gala event.',
    },
  })

  const quote3 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q2024-003' },
    update: {},
    create: {
      id: 'quote3',
      quoteNumber: 'Q2024-003',
      name: 'Community Fest Equipment',
      location: 'Main Stage',
      clientId: 'client3',
      clientName: 'Local Community Fest',
      clientEmail: 'carol.fest@community.example.org',
      startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 12)),
      subTotal: 1200.00,
      discountAmount: 120.00,
      discountType: 'percentage',
      taxRate: 0.05,
      taxAmount: 54.00,
      totalAmount: 1134.00,
      status: 'Draft',
      notes: 'Budget-friendly setup for community festival.',
    },
  })

  // Additional quotes for testing notifications
  const quote4 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q2024-004' },
    update: {},
    create: {
      id: 'quote4',
      quoteNumber: 'Q2024-004',
      name: 'Morning Seminar Setup',
      location: 'Auditorium A',
      clientId: 'client1',
      clientName: 'Tech Solutions Inc.',
      clientEmail: 'alice@techsolutions.example.com',
      startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      subTotal: 450.00,
      discountAmount: 0,
      discountType: 'fixed',
      taxRate: 0.05,
      taxAmount: 22.50,
      totalAmount: 472.50,
      status: 'Sent',
      notes: 'Audio equipment for morning seminar.',
    },
  })

  const quote5 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q2024-005' },
    update: {},
    create: {
      id: 'quote5',
      quoteNumber: 'Q2024-005',
      name: 'Afternoon Conference Lighting',
      location: 'Conference Hall B',
      clientId: 'client2',
      clientName: 'Creative Events Co.',
      clientEmail: 'bob@creativeevents.example.com',
      startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      subTotal: 800.00,
      discountAmount: 0,
      discountType: 'fixed',
      taxRate: 0.05,
      taxAmount: 40.00,
      totalAmount: 840.00,
      status: 'Accepted',
      notes: 'LED lighting for afternoon conference.',
    },
  })

  const quote6 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q2024-006' },
    update: {},
    create: {
      id: 'quote6',
      quoteNumber: 'Q2024-006',
      name: 'Evening Gala Package',
      location: 'Ballroom',
      clientId: 'client3',
      clientName: 'Local Community Fest',
      clientEmail: 'carol.fest@community.example.org',
      startDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      subTotal: 1500.00,
      discountAmount: 150.00,
      discountType: 'fixed',
      taxRate: 0.05,
      taxAmount: 67.50,
      totalAmount: 1417.50,
      status: 'Declined',
      notes: 'Full setup for evening gala event.',
    },
  })

  // Create quote items
  const quoteItem1 = await prisma.quoteItem.upsert({
    where: { id: 'qitem1' },
    update: {},
    create: {
      id: 'qitem1',
      quoteId: 'quote1',
      equipmentId: 'eq1',
      equipmentName: 'Shure SM58',
      quantity: 10,
      unitPrice: 15.00,
      days: 3,
      lineTotal: 450.00,
    },
  })

  const quoteItem2 = await prisma.quoteItem.upsert({
    where: { id: 'qitem2' },
    update: {},
    create: {
      id: 'qitem2',
      quoteId: 'quote1',
      equipmentId: 'eq2',
      equipmentName: 'Yamaha DBR10',
      quantity: 4,
      unitPrice: 45.00,
      days: 3,
      lineTotal: 540.00,
    },
  })

  const quoteItem3 = await prisma.quoteItem.upsert({
    where: { id: 'qitem3' },
    update: {},
    create: {
      id: 'qitem3',
      quoteId: 'quote2',
      equipmentId: 'eq4',
      equipmentName: 'Chauvet DJ SlimPAR 56',
      quantity: 12,
      unitPrice: 10.00,
      days: 3,
      lineTotal: 360.00,
    },
  })

  const quoteItem4 = await prisma.quoteItem.upsert({
    where: { id: 'qitem4' },
    update: {},
    create: {
      id: 'qitem4',
      quoteId: 'quote2',
      equipmentId: 'eq1',
      equipmentName: 'Shure SM58',
      quantity: 8,
      unitPrice: 15.00,
      days: 3,
      lineTotal: 360.00,
    },
  })

  const quoteItem5 = await prisma.quoteItem.upsert({
    where: { id: 'qitem5' },
    update: {},
    create: {
      id: 'qitem5',
      quoteId: 'quote3',
      equipmentId: 'eq2',
      equipmentName: 'Yamaha DBR10',
      quantity: 2,
      unitPrice: 45.00,
      days: 3,
      lineTotal: 270.00,
    },
  })

  // Create maintenance logs
  const maintenanceLog1 = await prisma.maintenanceLog.upsert({
    where: { id: 'maint1' },
    update: {},
    create: {
      id: 'maint1',
      equipmentId: 'eq3',
      date: new Date(new Date().setDate(new Date().getDate() - 30)),
      description: 'Routine maintenance check and bulb replacement.',
      cost: 150.00,
    },
  })

  const maintenanceLog2 = await prisma.maintenanceLog.upsert({
    where: { id: 'maint2' },
    update: {},
    create: {
      id: 'maint2',
      equipmentId: 'eq5',
      date: new Date(new Date().setDate(new Date().getDate() - 7)),
      description: 'Lens damaged during event, requires repair or replacement.',
      cost: 300.00,
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
