import type { EquipmentStatus } from '@/types';

export const EQUIPMENT_STATUSES: { value: EquipmentStatus; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const APP_NAME = "AV Rentals";
