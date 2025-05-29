import type { Category, Subcategory, EquipmentItem, Rental } from '@/types';

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

export const sampleEquipment: EquipmentItem[] = [
  {
    id: 'eq1',
    name: 'Shure SM58',
    description: 'Dynamic Vocal Microphone',
    categoryId: 'cat1',
    subcategoryId: 'subcat1_1',
    quantity: 10,
    status: 'good',
    location: 'Shelf A1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'eq2',
    name: 'Yamaha DBR10',
    description: '10" Powered Speaker',
    categoryId: 'cat1',
    subcategoryId: 'subcat1_2',
    quantity: 4,
    status: 'good',
    location: 'Shelf A2',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'eq3',
    name: 'Epson Pro EX7260',
    description: 'Wireless WXGA 3LCD Projector',
    categoryId: 'cat2',
    subcategoryId: 'subcat2_1',
    quantity: 3,
    status: 'maintenance',
    location: 'Tech Bench',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'eq4',
    name: 'Chauvet DJ SlimPAR 56',
    description: 'LED PAR Can Light',
    categoryId: 'cat3',
    subcategoryId: 'subcat3_1',
    quantity: 12,
    status: 'good',
    location: 'Shelf C1',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'eq5',
    name: 'Sony Alpha a7 III',
    description: 'Full-frame Mirrorless Camera',
    categoryId: 'cat2',
    subcategoryId: 'subcat2_3',
    quantity: 2,
    status: 'damaged',
    location: 'Repair Bin',
    imageUrl: 'https://placehold.co/600x400.png',
  },
];

export const sampleRentals: Rental[] = [
  {
    id: 'rental1',
    equipmentId: 'eq1',
    equipmentName: 'Shure SM58',
    startDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 4)),
    eventLocation: 'Conference Hall A',
    clientName: 'Tech Corp',
    internalResponsible: 'John Doe',
    quantityRented: 2,
  },
  {
    id: 'rental2',
    equipmentId: 'eq3',
    equipmentName: 'Epson Pro EX7260',
    startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    eventLocation: 'Hotel Ballroom',
    clientName: 'Events Inc.',
    internalResponsible: 'Jane Smith',
    quantityRented: 1,
  },
];
