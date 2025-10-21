

import type { Category, Subcategory, EquipmentItem, Rental, Client, Quote, QuoteItem, Event, MaintenanceLog, User } from '@/types';

// New sample data for Users (for reference only - using database now)
export const sampleUsers: User[] = [
  {
    id: 'admin-user-id',
    name: 'System Administrator',
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
    role: 'Admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tech-user-id',
    name: 'John Technician',
    username: 'john.tech',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
    role: 'Technician',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];


export const sampleCategories: Category[] = [
  { id: 'cat1', name: 'Audio', icon: 'Mic' },
  { id: 'cat2', name: 'Video', icon: 'Videotape' },
  { id: 'cat3', name: 'Lighting', icon: 'Zap' },
  { id: 'cat4', name: 'Staging', icon: 'Cuboid' },
];

export const sampleSubcategories: Subcategory[] = [
  { id: 'subcat1_1', name: 'Microphones', parentId: 'cat1' },
  { id: 'subcat1_2', name: 'Speakers', parentId: 'cat1' },
  { id: 'subcat1_3', name: 'Mixers', parentId: 'cat1' },
  { id: 'subcat2_1', name: 'Projectors', parentId: 'cat2' },
  { id: 'subcat2_2', name: 'Screens', parentId: 'cat2' },
  { id: 'subcat2_3', name: 'Cameras', parentId: 'cat2' },
  { id: 'subcat3_1', name: 'LED Pars', parentId: 'cat3' },
  { id: 'subcat3_2', name: 'Moving Heads', parentId: 'cat3' },
  { id: 'subcat4_1', name: 'Platforms', parentId: 'cat4' },
];

const sampleMaintenanceHistory: MaintenanceLog[] = [
    { id: 'maint1', equipmentId: 'eq3', date: new Date(new Date().setDate(new Date().getDate() - 20)), description: 'Replaced bulb assembly.', cost: 150 },
    { id: 'maint2', equipmentId: 'eq5', date: new Date(new Date().setDate(new Date().getDate() - 5)), description: 'Sensor cleaning and recalibration.', cost: 250 },
    { id: 'maint3', equipmentId: 'eq5', date: new Date(new Date().setDate(new Date().getDate() - 90)), description: 'Dropped by client. Lens mount replaced.', cost: 500 },
]

export const sampleEquipment: EquipmentItem[] = [
  {
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
  {
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
  {
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
    maintenanceHistory: sampleMaintenanceHistory.filter(m => m.equipmentId === 'eq3'),
    type: 'equipment',
  },
  {
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
  {
    id: 'eq5',
    name: 'Sony Alpha a7 III',
    description: 'Full-frame Mirrorless Camera, 4K video, excellent for event coverage.',
    categoryId: 'cat2',
    subcategoryId: 'subcat2_3',
    quantity: 2,
    status: 'damaged',
    location: 'Repair Bin',
    imageUrl: 'https://placehold.co/600x400.png',
    dailyRate: 120.00,
    maintenanceHistory: sampleMaintenanceHistory.filter(m => m.equipmentId === 'eq5'),
    type: 'equipment',
  },
  // Sample Consumable
  {
    id: 'consumable1',
    name: 'Gaffer Tape (Black)',
    description: 'Standard 2-inch black gaffer tape roll.',
    categoryId: 'cat4', // Or a new "Consumables" category
    quantity: 20,
    status: 'good',
    location: 'Supply Closet',
    imageUrl: 'https://placehold.co/600x400.png',
    dailyRate: 0, // Not rented by day
    type: 'consumable',
  },
];

export const sampleClients: Client[] = [
  {
    id: 'client1',
    name: 'Tech Solutions Inc.',
    contactPerson: 'Alice Wonderland',
    email: 'alice@techsolutions.example.com',
    phone: '555-0101',
    address: '123 Innovation Drive, Tech City',
    notes: 'Prefers morning deliveries. Key contact for larger events.',
  },
  {
    id: 'client2',
    name: 'Creative Events Co.',
    contactPerson: 'Bob The Builder',
    email: 'bob@creativeevents.example.com',
    phone: '555-0202',
    address: '456 Artful Ave, Design District',
    notes: 'Requires detailed setup diagrams.',
  },
  {
    id: 'client3',
    name: 'Local Community Fest',
    contactPerson: 'Carol Danvers',
    email: 'carol.fest@community.example.org',
    phone: '555-0303',
    address: '789 Community Park, Townsville',
    notes: 'Annual festival, budget-conscious.',
  },
];

const today = new Date();
const calculateEndDate = (startDate: Date, days: number): Date => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days -1); // If 1 day, end date is same as start date
  return date;
}


export const sampleEvents: Event[] = [
    {
        id: 'event1',
        name: 'Tech Solutions Annual Conference',
        clientId: 'client1',
        location: 'Conference Hall A',
        startDate: new Date(new Date(today).setDate(today.getDate() - 5)),
        endDate: new Date(new Date(today).setDate(today.getDate() - 3)),
        date: new Date(new Date(today).setDate(today.getDate() - 5)),
    },
    {
        id: 'event2',
        name: 'Creative Events Gala',
        clientId: 'client2',
        location: 'Hotel Ballroom',
        startDate: new Date(new Date(today).setDate(today.getDate() + 2)),
        endDate: new Date(new Date(today).setDate(today.getDate() + 4)),
        date: new Date(new Date(today).setDate(today.getDate() + 2)),
    },
    {
        id: 'event3',
        name: 'Tech Solutions Product Launch',
        clientId: 'client1',
        location: 'Outdoor Stage',
        startDate: new Date(new Date(today).setDate(today.getDate() + 5)),
        endDate: new Date(new Date(today).setDate(today.getDate() + 7)),
        date: new Date(new Date(today).setDate(today.getDate() + 5)),
    }
];


export const sampleRentals: Rental[] = [
  {
    id: 'rental1',
    eventId: 'event1',
    equipmentId: 'eq1',
    quantityRented: 2,
  },
   {
    id: 'rental1.2',
    eventId: 'event1',
    equipmentId: 'eq2',
    quantityRented: 2,
  },
  {
    id: 'rental2',
    eventId: 'event2',
    equipmentId: 'eq3',
    quantityRented: 1,
  },
  {
    id: 'rental3',
    eventId: 'event3',
    equipmentId: 'eq2',
    quantityRented: 4,
  },
];

const quoteItems1: QuoteItem[] = [
  { id: 'qi1_1', equipmentId: 'eq1', equipmentName: 'Shure SM58', quantity: 4, unitPrice: 15.00, days: 3, lineTotal: 4 * 15.00 * 3 },
  { id: 'qi1_2', equipmentId: 'eq2', equipmentName: 'Yamaha DBR10', quantity: 2, unitPrice: 45.00, days: 3, lineTotal: 2 * 45.00 * 3 },
];
const subTotal1 = quoteItems1.reduce((sum, item) => sum + item.lineTotal, 0);
const taxAmount1 = subTotal1 * 0.05; // 5% tax

const quoteItems2: QuoteItem[] = [
  { id: 'qi2_1', equipmentId: 'eq3', equipmentName: 'Epson Pro EX7260', quantity: 1, unitPrice: 70.00, days: 7, lineTotal: 1 * 70.00 * 7 }, // Price override
  { id: 'qi2_2', equipmentId: 'eq4', equipmentName: 'Chauvet DJ SlimPAR 56', quantity: 8, unitPrice: 10.00, days: 7, lineTotal: 8 * 10.00 * 7 },
];
const subTotal2 = quoteItems2.reduce((sum, item) => sum + item.lineTotal, 0);
const discountAmount2 = 50; // Fixed discount
const taxAmount2 = (subTotal2 - discountAmount2) * 0.07; // 7% tax

export const sampleQuotes: Quote[] = [
  {
    id: 'quote1',
    quoteNumber: `Q${today.getFullYear()}-001`,
    name: 'Summer Music Fest',
    location: 'Community Park Stage',
    clientId: 'client3',
    clientName: 'Local Community Fest',
    clientEmail: 'carol.fest@community.example.org',
    startDate: new Date(new Date(today).setDate(today.getDate() + 30)),
    endDate: calculateEndDate(new Date(new Date(today).setDate(today.getDate() + 30)), 3),
    items: quoteItems1,
    subTotal: subTotal1,
    discountType: 'percentage',
    discountAmount: 0, // No discount
    taxRate: 0.05,
    taxAmount: taxAmount1,
    totalAmount: subTotal1 + taxAmount1,
    status: 'Accepted',
    notes: 'Setup required by 8 AM on the first day. Soundcheck assistance requested.',
    createdAt: new Date(new Date(today).setMonth(today.getMonth() - 2)),
    updatedAt: new Date(new Date(today).setMonth(today.getMonth() - 2)),
  },
  {
    id: 'quote2',
    quoteNumber: `Q${today.getFullYear()}-002`,
    name: 'Corporate Gala Dinner',
    location: 'Grand Hotel Ballroom',
    clientId: 'client1',
    clientName: 'Tech Solutions Inc.',
    clientEmail: 'alice@techsolutions.example.com',
    startDate: new Date(new Date(today).setDate(today.getDate() + 60)),
    endDate: calculateEndDate(new Date(new Date(today).setDate(today.getDate() + 60)), 7),
    items: quoteItems2,
    subTotal: subTotal2,
    discountType: 'fixed',
    discountAmount: discountAmount2,
    taxRate: 0.07,
    taxAmount: taxAmount2,
    totalAmount: subTotal2 - discountAmount2 + taxAmount2,
    status: 'Sent',
    notes: 'Includes on-site technician for the main event day.',
    createdAt: new Date(new Date(today).setMonth(today.getMonth() - 1)),
    updatedAt: new Date(new Date(today).setMonth(today.getMonth() - 1)),
  },
  {
    id: 'quote3',
    quoteNumber: `Q${today.getFullYear()}-003`,
    name: 'Another Tech Solutions Event',
    location: 'HQ Auditorium',
    clientId: 'client1',
    clientName: 'Tech Solutions Inc.',
    clientEmail: 'alice@techsolutions.example.com',
    startDate: new Date(new Date(today).setDate(today.getDate() + 90)),
    endDate: calculateEndDate(new Date(new Date(today).setDate(today.getDate() + 90)), 2),
    items: [
        { id: 'qi3_1', equipmentId: 'eq1', equipmentName: 'Shure SM58', quantity: 10, unitPrice: 15.00, days: 2, lineTotal: 10 * 15.00 * 2 },
    ],
    subTotal: 300,
    discountType: 'fixed',
    discountAmount: 0,
    taxRate: 0.07,
    taxAmount: 21,
    totalAmount: 321,
    status: 'Accepted',
    notes: '',
    createdAt: new Date(new Date(today).setMonth(today.getMonth() - 3)),
    updatedAt: new Date(new Date(today).setMonth(today.getMonth() - 3)),
  }
];
