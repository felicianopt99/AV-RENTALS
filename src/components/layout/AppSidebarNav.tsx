
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, LayoutList, CalendarDays, GanttChartSquare, Users, FileText, Package } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/equipment/new', label: 'Add Equipment', icon: PlusSquare },
  { href: '/categories', label: 'Manage Categories', icon: LayoutList },
  { href: '/clients', label: 'Manage Clients', icon: Users },
  { href: '/rentals/new', label: 'Create Rental', icon: GanttChartSquare },
  { href: '/rentals/calendar', label: 'Rental Calendar', icon: CalendarDays },
  { href: '/quotes', label: 'Manage Quotes', icon: FileText }, // New Quotes Link
];

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                className={cn(isActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
                isActive={isActive}
                tooltip={item.label}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
