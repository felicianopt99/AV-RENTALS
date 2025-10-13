"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, CalendarDays, Users, FileText, Package, PartyPopper, Wrench, Shield, Settings, Palette, User } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarGroup, SidebarGroupLabel, useSidebar } from '@/components/ui/sidebar';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useMemo, useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { navItems as baseNavItems, adminItems as baseAdminItems } from '@/components/layout/navConfig';

export function AppSidebarNav() {
  const pathname = usePathname();
  const { currentUser, isDataLoaded } = useAppContext();
  const { state: sidebarState, isMobile, toggleSidebar } = useSidebar();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = Math.abs(touchEndY - touchStartY.current);

      // Swipe right to open, left to close, if horizontal swipe is significant
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0 && sidebarState === 'collapsed') {
          toggleSidebar();
        } else if (deltaX < 0 && sidebarState === 'expanded') {
          toggleSidebar();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, sidebarState, toggleSidebar]);

  // Use useMemo to prevent recalculation on every render
  const visibleNavItems = useMemo(() => {
    const userRole = currentUser?.role || 'Viewer';
    return baseNavItems.filter(item => item.requiredRole.includes(userRole));
  }, [currentUser?.role]);

  if (!isDataLoaded) {
      return (
        <SidebarMenu>
          {baseNavItems.map((item, index) => (
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

  const isCollapsed = sidebarState === 'collapsed';

  return (
    <TooltipProvider>
      <>
        <SidebarMenu>
          {visibleNavItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isParentActive = item.href ? ((item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
            const isSubActive = hasSub && item.subItems!.some(sub => pathname.startsWith(sub.href));
            const parentActive = isParentActive || isSubActive;
            const linkClass = cn(
              "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
              "h-8 text-sm sidebar-hover glass"
            );

            const renderMenuItem = (content: React.ReactNode, label: string, href?: string) => {
              if (isCollapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={href || '#'}
                        data-sidebar="menu-button"
                        data-size="default"
                        data-active={parentActive}
                        className={linkClass}
                      >
                        {content}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="w-48">
                      <p>{label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return (
                <Link
                  href={href || '#'}
                  data-sidebar="menu-button"
                  data-size="default"
                  data-active={parentActive}
                  className={linkClass}
                >
                  {content}
                </Link>
              );
            };

            return (
              <SidebarMenuItem key={item.href || item.label}>
                {item.href ? (
                  renderMenuItem(
                    <>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </>,
                    item.label,
                    item.href
                  )
                ) : (
                  renderMenuItem(
                    <>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </>,
                    item.label
                  )
                )}
                {hasSub && item.subItems && (
                  <SidebarMenuSub>
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname.startsWith(sub.href);
                      return (
                        <SidebarMenuSubItem key={sub.href}>
                          {renderMenuItem(
                            <span>{sub.label}</span>,
                            sub.label,
                            sub.href
                          )}
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
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
                {baseAdminItems.map((item) => {
                  const href = item.href ?? '#';
                  const isActive = href !== '#' ? pathname.startsWith(href) : false;

                  return (
                    <SidebarMenuItem key={href}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={href}
                              data-sidebar="menu-button"
                              data-size="default"
                              data-active={isActive}
                              className={cn(
                                "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                                "h-8 text-sm sidebar-hover glass"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-48">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={href}
                          data-sidebar="menu-button"
                          data-size="default"
                          data-active={isActive}
                          className={cn(
                            "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                            "h-8 text-sm sidebar-hover glass"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </>
    </TooltipProvider>
  );
}
