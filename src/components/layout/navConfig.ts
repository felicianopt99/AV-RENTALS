import { Home, CalendarDays, Users, FileText, Package, Wrench, Shield, Settings, Palette, Users2 } from 'lucide-react';

export type NavItem = {
  href?: string;
  label: string;
  icon?: any;
  requiredRole: Array<'Admin' | 'Manager' | 'Technician' | 'Employee' | 'Viewer'>;
  subItems?: Array<{ href: string; label: string }>
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, requiredRole: ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer'] },
  { label: 'Inventory', icon: Package, requiredRole: ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer'], subItems: [
    { href: '/inventory', label: 'View Inventory' },
    { href: '/categories', label: 'Categories' }
  ] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, requiredRole: ['Admin', 'Manager', 'Technician'] },
  { href: '/clients', label: 'Clients', icon: Users, requiredRole: ['Admin', 'Manager', 'Employee'] },
  { href: '/team', label: 'Team', icon: Users2, requiredRole: ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer'] },
  { label: 'Rentals', icon: CalendarDays, requiredRole: ['Admin', 'Manager', 'Employee'], subItems: [
    { href: '/rentals/calendar', label: 'Event Calendar' },
    { href: '/events', label: 'Events' },
    { href: '/quotes', label: 'Quotes' }
  ] },
];

export const adminItems: NavItem[] = [
  { href: '/admin/users', label: 'User Management', icon: Shield, requiredRole: ['Admin'] },
  { href: '/admin/customization', label: 'Customization', icon: Palette, requiredRole: ['Admin'] },
  { href: '/admin/settings', label: 'System Settings', icon: Settings, requiredRole: ['Admin'] },
];
