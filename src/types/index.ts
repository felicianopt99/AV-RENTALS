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
}

export interface Rental {
  id: string;
  equipmentId: string;
  equipmentName: string; // For display convenience
  startDate: Date;
  endDate: Date;
  eventLocation: string;
  clientName: string;
  internalResponsible: string;
  quantityRented: number;
}
