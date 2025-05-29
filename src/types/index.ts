
export interface Category {
  id: string;
  name: string;
  icon?: string; // Lucide icon name or SVG path
}

export interface Subcategory {
  id: string;
  name: string;
  parentId: string; // Category ID
}

export type EquipmentStatus = 'good' | 'damaged' | 'maintenance';

export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  quantity: number;
  status: EquipmentStatus;
  location: string; // Physical location
  imageUrl?: string;
  dailyRate: number; // Added daily rental rate
}

export interface Client {
  id: string;
  name: string; // Company name or individual's full name
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Rental {
  id: string;
  equipmentId: string;
  equipmentName: string; // For display convenience
  clientId: string; // Link to the Client
  clientName: string; // For display convenience, denormalized
  startDate: Date;
  endDate: Date;
  eventLocation: string;
  internalResponsible: string;
  quantityRented: number;
}

// New types for Quotes
export interface QuoteItem {
  id: string; // Unique ID for the quote item line
  equipmentId: string;
  equipmentName: string; // Store at time of quote creation
  quantity: number;
  unitPrice: number; // Price per unit per day at time of quote creation
  days: number;
  lineTotal: number;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Archived';

export interface Quote {
  id: string;
  quoteNumber: string; // e.g., Q2024-001
  name: string; // User-defined name for the quote
  clientId?: string; // Optional: Link to an existing client
  clientName: string; // Can be manually entered or from selected client
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  startDate: Date;
  endDate: Date;
  items: QuoteItem[];
  subTotal: number;
  discountAmount: number; // Can be percentage or fixed amount
  discountType: 'percentage' | 'fixed';
  taxRate: number; // Percentage e.g. 0.05 for 5%
  taxAmount: number;
  totalAmount: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
