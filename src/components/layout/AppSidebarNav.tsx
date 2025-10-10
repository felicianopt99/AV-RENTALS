
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, CalendarDays, Users, FileText, Package, PartyPopper, Wrench, Shield, Settings, Palette } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarGroup, SidebarGroupLabel, useSidebar } from '@/components/ui/sidebar';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, requiredRole: ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer'] },
  { href: '/inventory', label: 'Inventory', icon: Package, requiredRole: ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, requiredRole: ['Admin', 'Manager', 'Technician'] },
  { href: '/categories', label: 'Manage Categories', icon: LayoutList, requiredRole: ['Admin', 'Manager'] },
  { href: '/clients', label: 'Manage Clients', icon: Users, requiredRole: ['Admin', 'Manager', 'Employee'] },
  { href: '/events', label: 'Events', icon: PartyPopper, requiredRole: ['Admin', 'Manager', 'Employee'] },
  { href: '/rentals/calendar', label: 'Event Calendar', icon: CalendarDays, requiredRole: ['Admin', 'Manager', 'Technician', 'Employee'] },
  { href: '/quotes', label: 'Manage Quotes', icon: FileText, requiredRole: ['Admin', 'Manager', 'Employee'] },
];

const adminItems = [
  { href: '/admin/users', label: 'User Management', icon: Shield },
  { href: '/admin/customization', label: 'Customization', icon: Palette },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { currentUser, isDataLoaded } = useAppContext();
  const { state: sidebarState, isMobile } = useSidebar();

  // Use useMemo to prevent recalculation on every render
  const visibleNavItems = useMemo(() => {
    const userRole = currentUser?.role || 'Viewer';
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
    <>
      <SidebarMenu>
        {visibleNavItems.map((item) => {
          const isActive = (item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <SidebarMenuItem key={item.href}>
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
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      {currentUser?.role === 'Admin' && (
        <>
          <div className="px-3 py-2">
            <div className="h-px bg-sidebar-border"></div>
          </div>
          
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 px-2 pb-2">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu>
              {adminItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                
                return (
                  <SidebarMenuItem key={item.href}>
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
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}
    </>
  );
}

    