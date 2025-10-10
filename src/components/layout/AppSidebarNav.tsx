
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, CalendarDays, Users, FileText, Package, PartyPopper, Wrench } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home, requiredRole: ['Admin', 'Technician'] },
  { href: '/inventory', label: 'Inventory', icon: Package, requiredRole: ['Admin', 'Technician'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, requiredRole: ['Admin', 'Technician'] },
  { href: '/categories', label: 'Manage Categories', icon: LayoutList, requiredRole: ['Admin'] },
  { href: '/clients', label: 'Manage Clients', icon: Users, requiredRole: ['Admin'] },
  { href: '/events', label: 'Events', icon: PartyPopper, requiredRole: ['Admin', 'Technician'] },
  { href: '/rentals/calendar', label: 'Rental Calendar', icon: CalendarDays, requiredRole: ['Admin', 'Technician'] },
  { href: '/quotes', label: 'Manage Quotes', icon: FileText, requiredRole: ['Admin'] },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { currentUser } = useAppContext();
  const { state: sidebarState, isMobile } = useSidebar();

  const userRole = currentUser?.role || 'Technician';

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
        const hasPermission = item.requiredRole.includes(userRole);

        if (!hasPermission) {
          return null;
        }
        
        const buttonContent = (
          <>
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </>
        );

        return (
          <SidebarMenuItem key={item.href}>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton isActive={isActive}>
                           {buttonContent}
                        </SidebarMenuButton>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={sidebarState !== "collapsed" || isMobile}>
                    {item.label}
                </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
