import type { UserRole, RolePermissions } from '@/types';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    canManageUsers: true,
    canManageEquipment: true,
    canManageClients: true,
    canManageEvents: true,
    canManageQuotes: true,
    canManageRentals: true,
    canViewReports: true,
    canManageMaintenance: true,
  },
  Manager: {
    canManageUsers: false,
    canManageEquipment: true,
    canManageClients: true,
    canManageEvents: true,
    canManageQuotes: true,
    canManageRentals: true,
    canViewReports: true,
    canManageMaintenance: true,
  },
  Technician: {
    canManageUsers: false,
    canManageEquipment: true,
    canManageClients: false,
    canManageEvents: false,
    canManageQuotes: false,
    canManageRentals: true,
    canViewReports: false,
    canManageMaintenance: true,
  },
  Employee: {
    canManageUsers: false,
    canManageEquipment: false,
    canManageClients: true,
    canManageEvents: true,
    canManageQuotes: true,
    canManageRentals: true,
    canViewReports: false,
    canManageMaintenance: false,
  },
  Viewer: {
    canManageUsers: false,
    canManageEquipment: false,
    canManageClients: false,
    canManageEvents: false,
    canManageQuotes: false,
    canManageRentals: false,
    canViewReports: false,
    canManageMaintenance: false,
  },
};

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Admin: 'Full system access including user management',
  Manager: 'Business operations management (no user management)',
  Technician: 'Equipment and maintenance focus',
  Employee: 'Basic operations and customer management',
  Viewer: 'Read-only access to view data',
};