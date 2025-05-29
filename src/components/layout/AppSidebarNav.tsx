"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, LayoutList, CalendarDays, GanttChartSquare } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/equipment/new', label: 'Add Equipment', icon: PlusSquare },
  { href: '/categories', label: 'Manage Categories', icon: LayoutList },
  { href: '/rentals/new', label: 'Create Rental', icon: GanttChartSquare },
  { href: '/rentals/calendar', label: 'Rental Calendar', icon: CalendarDays },
];

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                className={cn(pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground")}
                isActive={pathname === item.href}
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
