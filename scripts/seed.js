import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertUser({ name, username, password, role, isActive = true }) {
  const hash = await bcrypt.hash(password, 12)
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return prisma.user.update({ where: { username }, data: { name, password: hash, role, isActive } })
  }
  return prisma.user.create({ data: { name, username, password: hash, role, isActive } })
}

async function findOrCreateCategory({ name, icon, createdBy }) {
  const existing = await prisma.category.findFirst({ where: { name } })
  if (existing) return prisma.category.update({ where: { id: existing.id }, data: { icon, updatedBy: createdBy } })
  return prisma.category.create({ data: { name, icon, createdBy, updatedBy: createdBy } })
}

async function findOrCreateSubcategory({ name, parentId, createdBy }) {
  const existing = await prisma.subcategory.findFirst({ where: { name, parentId } })
  if (existing) return prisma.subcategory.update({ where: { id: existing.id }, data: { updatedBy: createdBy } })
  return prisma.subcategory.create({ data: { name, parentId, createdBy, updatedBy: createdBy } })
}

async function findOrCreateClient(data, createdBy) {
  const existing = await prisma.client.findFirst({ where: { name: data.name } })
  if (existing) return prisma.client.update({ where: { id: existing.id }, data: { ...data, updatedBy: createdBy } })
  return prisma.client.create({ data: { ...data, createdBy, updatedBy: createdBy } })
}

async function findOrCreateService(data) {
  const existing = await prisma.service.findFirst({ where: { name: data.name } })
  if (existing) return prisma.service.update({ where: { id: existing.id }, data })
  return prisma.service.create({ data })
}

async function findOrCreateFee(data) {
  const existing = await prisma.fee.findFirst({ where: { name: data.name } })
  if (existing) return prisma.fee.update({ where: { id: existing.id }, data })
  return prisma.fee.create({ data })
}

async function findOrCreateEquipment(data, createdBy) {
  const existing = await prisma.equipmentItem.findFirst({ where: { name: data.name } })
  if (existing) {
    return prisma.equipmentItem.update({
      where: { id: existing.id },
      data: { ...data, updatedBy: createdBy },
    })
  }
  return prisma.equipmentItem.create({ data: { ...data, createdBy, updatedBy: createdBy } })
}

async function findOrCreateEvent(data, createdBy) {
  const existing = await prisma.event.findFirst({ where: { name: data.name } })
  if (existing) return prisma.event.update({ where: { id: existing.id }, data: { ...data, updatedBy: createdBy } })
  return prisma.event.create({ data: { ...data, createdBy, updatedBy: createdBy } })
}

async function main() {
  const admin = await upsertUser({ name: 'System Admin', username: 'admin', password: 'Admin!234', role: 'Admin' })
  await upsertUser({ name: 'Operations Manager', username: 'manager', password: 'Manager!234', role: 'Manager' })
  await upsertUser({ name: 'Staff User', username: 'staff', password: 'Staff!234', role: 'Employee' })

  const createdBy = admin.id

  const categoriesData = [
    { name: 'Lighting', icon: 'Sun' },
    { name: 'Audio', icon: 'Volume2' },
    { name: 'Video', icon: 'Camera' },
    { name: 'Staging', icon: 'Box' },
  ]

  const categories = []
  for (const c of categoriesData) {
    const cat = await findOrCreateCategory({ ...c, createdBy })
    categories.push(cat)
  }

  const subcategoriesMap = new Map()
  for (const cat of categories) {
    const seeds = cat.name === 'Lighting'
      ? ['Moving Heads', 'LED Pars', 'Control']
      : cat.name === 'Audio'
      ? ['Mixers', 'Speakers', 'Microphones']
      : cat.name === 'Video'
      ? ['Projectors', 'LED Screens', 'Cameras']
      : ['Platforms', 'Truss', 'Rigging']

    const subs = []
    for (const s of seeds) {
      const sub = await findOrCreateSubcategory({ name: s, parentId: cat.id, createdBy })
      subs.push(sub)
    }
    subcategoriesMap.set(cat.id, subs)
  }

  const equipmentSeeds = [
    { name: 'LED Par 64', description: 'RGBW LED Par can', category: 'Lighting', sub: 'LED Pars', quantity: 24, status: 'Available', location: 'Warehouse A', dailyRate: 15, type: 'fixture' },
    { name: 'Moving Head Spot 350W', description: 'Moving head spotlight', category: 'Lighting', sub: 'Moving Heads', quantity: 12, status: 'Available', location: 'Warehouse A', dailyRate: 65, type: 'fixture' },
    { name: 'Digital Mixer 32ch', description: '32-channel digital console', category: 'Audio', sub: 'Mixers', quantity: 3, status: 'Available', location: 'Warehouse B', dailyRate: 120, type: 'mixer' },
    { name: 'Powered Speaker 15"', description: '15-inch powered speaker', category: 'Audio', sub: 'Speakers', quantity: 16, status: 'Available', location: 'Warehouse B', dailyRate: 30, type: 'speaker' },
    { name: 'Projector 10k ANSI', description: '10,000 lumen projector', category: 'Video', sub: 'Projectors', quantity: 2, status: 'Available', location: 'Warehouse C', dailyRate: 180, type: 'projector' },
    { name: 'Stage Platform 2x1m', description: 'Modular stage deck', category: 'Staging', sub: 'Platforms', quantity: 20, status: 'Available', location: 'Warehouse C', dailyRate: 20, type: 'staging' },
  ]

  function getIds(categoryName, subName) {
    const cat = categories.find(c => c.name === categoryName)
    const subs = subcategoriesMap.get(cat.id)
    const sub = subs.find(s => s.name === subName)
    return { categoryId: cat.id, subcategoryId: sub?.id }
  }

  for (const e of equipmentSeeds) {
    const ids = getIds(e.category, e.sub)
    await findOrCreateEquipment({
      name: e.name,
      description: e.description,
      categoryId: ids.categoryId,
      subcategoryId: ids.subcategoryId,
      quantity: e.quantity,
      status: e.status,
      location: e.location,
      dailyRate: e.dailyRate,
      type: e.type,
    }, createdBy)
  }

  const clientsData = [
    { name: 'Acme Corp', contactPerson: 'Jane Doe', email: 'events@acme.test', phone: '+351 900 000 001', address: 'Av. Central 100, Porto' },
    { name: 'BlueWave Productions', contactPerson: 'John Smith', email: 'bookings@bluewave.test', phone: '+351 900 000 002', address: 'Rua da Praia 50, Lisboa' },
  ]

  const clients = []
  for (const c of clientsData) {
    const client = await findOrCreateClient(c, createdBy)
    clients.push(client)
  }

  const servicesData = [
    { name: 'Lighting Technician', description: 'Setup and operate lighting', unitPrice: 150, unit: 'day', category: 'Labor' },
    { name: 'Audio Engineer', description: 'FOH or monitor engineer', unitPrice: 200, unit: 'day', category: 'Labor' },
    { name: 'Delivery', description: 'Transport to venue (local)', unitPrice: 80, unit: 'trip', category: 'Logistics' },
  ]
  for (const s of servicesData) {
    await findOrCreateService(s)
  }

  const feesData = [
    { name: 'Damage Waiver', description: 'Waiver fee', amount: 5, type: 'percent', category: 'Protection', isRequired: false },
    { name: 'Setup Fee', description: 'On-site setup', amount: 50, type: 'fixed', category: 'Service', isRequired: false },
  ]
  for (const f of feesData) {
    await findOrCreateFee(f)
  }

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 0, 0)

  const event = await findOrCreateEvent({
    name: 'Acme Annual Meeting',
    clientId: clients[0].id,
    location: 'Centro de Congressos de Lisboa',
    startDate: start,
    endDate: end,
  }, createdBy)

  const equipment = await prisma.equipmentItem.findMany({ take: 4 })
  for (const eq of equipment) {
    const existing = await prisma.rental.findFirst({ where: { eventId: event.id, equipmentId: eq.id } })
    if (existing) {
      await prisma.rental.update({ where: { id: existing.id }, data: { quantityRented: 1 } })
    } else {
      await prisma.rental.create({ data: { eventId: event.id, equipmentId: eq.id, quantityRented: 1 } })
    }
  }

  await prisma.customizationSettings.upsert({
    where: { id: 'default-settings' },
    update: { companyName: 'Acrobaticz AV Rentals', systemName: 'AV Rentals', language: 'pt', updatedBy: createdBy },
    create: { id: 'default-settings', companyName: 'Acrobaticz AV Rentals', systemName: 'AV Rentals', language: 'pt', updatedBy: createdBy },
  })

  return { admin: { username: 'admin' }, manager: { username: 'manager' }, staff: { username: 'staff' } }
}

main()
  .then(async (result) => {
    console.log('Seed complete:', result)
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
