

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, LayoutList, CalendarDays, GanttChartSquare, Users, FileText, Package, PartyPopper } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/categories', label: 'Manage Categories', icon: LayoutList },
  { href: '/clients', label: 'Manage Clients', icon: Users },
  { href: '/events', label: 'Events', icon: PartyPopper },
  { href: '/rentals/calendar', label: 'Rental Calendar', icon: CalendarDays },
  { href: '/quotes', label: 'Manage Quotes', icon: FileText },
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
