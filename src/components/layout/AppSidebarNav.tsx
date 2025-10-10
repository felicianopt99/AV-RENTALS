
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, CalendarDays, Users, FileText, Package, PartyPopper, Wrench } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

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

  // Use useMemo to prevent recalculation on every render
  const visibleNavItems = useMemo(() => {
    const userRole = currentUser?.role || 'Technician';
    return navItems.filter(item => item.requiredRole.includes(userRole));
  }, [currentUser?.role]);

  if (!isDataLoaded) {
      return (
        <SidebarMenu>
          {navItems.map((item, index) => (
             <SidebarMenuItem key={`loading-${index}`}>
                <div className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm opacity-50">
                    <item.icon className="h-5 w-5" />
                    <span className='w-32 h-4 bg-muted animate-pulse rounded-md'></span>
                </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )
  }

  return (
    <SidebarMenu>
      {visibleNavItems.map((item) => {
        const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
        
        return (
          <SidebarMenuItem key={item.href}>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Link 
                      href={item.href}
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={isActive}
                      className={cn(
                        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                        "h-8 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
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

    