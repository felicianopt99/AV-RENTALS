
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, CalendarDays, Users, FileText, Package, PartyPopper, Wrench } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';

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
  const { currentUser, isDataLoaded } = useAppContext();
  const { state: sidebarState, isMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const userRole = currentUser?.role || 'Technician';

  // Only render the role-filtered nav items on the client after hydration
  const visibleNavItems = isClient ? navItems.filter(item => item.requiredRole.includes(userRole)) : [];


  if (!isClient || !isDataLoaded) {
      // Render a placeholder or skeleton on the server and during initial client render
      return (
        <SidebarMenu>
          {navItems.map((item, index) => (
             <SidebarMenuItem key={index}>
                <SidebarMenuButton isActive={false} disabled>
                    <item.icon className="h-5 w-5" />
                    <span className='w-32 h-4 bg-muted animate-pulse rounded-md'></span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )
  }

  return (
    <SidebarMenu>
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
        
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
                    <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                           {buttonContent}
                        </Link>
                    </SidebarMenuButton>
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

    