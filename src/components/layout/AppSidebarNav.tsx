"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, CalendarDays, Users, FileText, Package, PartyPopper, Wrench, Shield, Settings, Palette, User, ChevronDown } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarGroup, SidebarGroupLabel, useSidebar } from '@/components/ui/sidebar';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { navItems as baseNavItems, adminItems as baseAdminItems } from '@/components/layout/navConfig';

export function AppSidebarNav() {
  const pathname = usePathname();
  const { currentUser, isDataLoaded } = useAppContext();
  const { state: sidebarState, isMobile, toggleSidebar } = useSidebar();

  // DEBUG: Log context and nav state
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[Sidebar Debug]', {
      currentUser,
      isDataLoaded,
    });
  }

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  
  // State for tracking expanded sub-menu sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Function to toggle expanded state of a section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };



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
    const items = baseNavItems.filter(item => item.requiredRole.includes(userRole));
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[Sidebar Debug] visibleNavItems', items);
    }
    return items;
  }, [currentUser?.role]);

  // Auto-expand sections containing active sub-items
  useEffect(() => {
    visibleNavItems.forEach(item => {
      if (item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href))) {
        const sectionKey = item.href || item.label;
        setExpandedSections(prev => new Set([...prev, sectionKey]));
      }
    });
  }, [pathname, visibleNavItems]);

  if (!isDataLoaded) {
      return (
        <SidebarMenu>
          {baseNavItems.map((item, index) => (
             <SidebarMenuItem key={`loading-${index}`} className={`nav-item-${index}`}>
                <div className="flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-left text-sm">
                    <div className="h-5 w-5 nav-loading-skeleton rounded-lg" />
                    <div className='w-28 h-4 nav-loading-skeleton rounded-lg'></div>
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
          {visibleNavItems.map((item, index) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isParentActive = item.href ? ((item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
            const isSubActive = hasSub && item.subItems!.some(sub => pathname.startsWith(sub.href));
            const parentActive = isParentActive || isSubActive;
            const linkClass = cn(
              // Base styles with modern feel
              "group/menu-item relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-left text-sm font-medium outline-none transition-all duration-300 ease-out",
              // Focus and interaction states
              "ring-sidebar-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/50",
              // Hover effects with subtle animations and enhanced visual feedback
              "hover:bg-gradient-to-r hover:from-sidebar-accent/80 hover:to-sidebar-accent/40 hover:text-sidebar-accent-foreground hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:translate-x-1",
              // Icon animation on hover
              "hover:[&>svg]:scale-110 hover:[&>svg]:rotate-3 hover:[&>svg]:text-primary",
              // Active state with enhanced modern styling
              "data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20",
              // Enhanced active indicator with glow effect
              "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:w-1 data-[active=true]:before:h-8 data-[active=true]:before:bg-primary data-[active=true]:before:rounded-r-full data-[active=true]:before:shadow-lg data-[active=true]:before:shadow-primary/50",
              // Icon-only collapsed state with better spacing
              "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl",
              // Disabled states
              "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
              // Enhanced icon and text styling
              "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:transition-all [&>svg]:duration-300 [&>svg]:ease-out",
              // Subtle border for better definition
              "border border-transparent hover:border-sidebar-border/50 data-[active=true]:border-primary/30"
            );

            const sectionKey = item.href || item.label;
            const isExpanded = expandedSections.has(sectionKey);

            const renderMenuItem = (content: React.ReactNode, label: string, href?: string, hasSubItems = false) => {
              if (isCollapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {hasSubItems ? (
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          data-sidebar="menu-button"
                          data-size="default"
                          data-active={parentActive}
                          className={linkClass}
                        >
                          {content}
                        </button>
                      ) : (
                        <Link
                          href={href || '#'}
                          data-sidebar="menu-button"
                          data-size="default"
                          data-active={parentActive}
                          className={linkClass}
                        >
                          {content}
                        </Link>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="w-48">
                      <p>{label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (hasSubItems) {
                return (
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    data-sidebar="menu-button"
                    data-size="default"
                    data-active={parentActive}
                    className={linkClass}
                  >
                    {content}
                  </button>
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
              <SidebarMenuItem key={item.href || item.label} className={`nav-stagger nav-item-${index}`}>
                {hasSub ? (
                  // Collapsible section with sub-items
                  renderMenuItem(
                    <>
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 transition-transform duration-300 ease-out",
                          isExpanded ? "rotate-180" : "rotate-0"
                        )} 
                      />
                    </>,
                    item.label,
                    undefined,
                    true
                  )
                ) : (
                  // Regular menu item with direct link
                  renderMenuItem(
                    <>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </>,
                    item.label,
                    item.href
                  )
                )}
                {hasSub && item.subItems && isExpanded && (
                  <SidebarMenuSub className={cn(
                    "animate-in slide-in-from-top-2 duration-300 ease-out",
                    "space-y-1 mt-2"
                  )}>
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname.startsWith(sub.href);
                      return (
                        <SidebarMenuSubItem key={sub.href}>
                          <Link
                            href={sub.href}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg p-2 text-sm transition-all duration-200 ease-out",
                              "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-1",
                              isSubActive 
                                ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                            )}
                          >
                            <div className="h-2 w-2 rounded-full bg-current opacity-50" />
                            <span>{sub.label}</span>
                          </Link>
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
            <div className="px-4 py-4">
              <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent"></div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 px-3 pb-3 tracking-wider uppercase">
                Administration
              </SidebarGroupLabel>
              <SidebarMenu>
                {baseAdminItems.map((item, adminIndex) => {
                  const href = item.href ?? '#';
                  const isActive = href !== '#' ? pathname.startsWith(href) : false;

                  return (
                    <SidebarMenuItem key={href} className={`nav-stagger nav-item-${adminIndex + visibleNavItems.length + 1}`}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={href}
                              data-sidebar="menu-button"
                              data-size="default"
                              data-active={isActive}
                              className={cn(
                                // Base styles with modern feel - matching main nav
                                "group/menu-item relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-left text-sm font-medium outline-none transition-all duration-300 ease-out",
                                // Focus and interaction states
                                "ring-sidebar-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/50",
                                // Hover effects with subtle animations and enhanced visual feedback
                                "hover:bg-gradient-to-r hover:from-sidebar-accent/80 hover:to-sidebar-accent/40 hover:text-sidebar-accent-foreground hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:translate-x-1",
                                // Icon animation on hover
                                "hover:[&>svg]:scale-110 hover:[&>svg]:rotate-3 hover:[&>svg]:text-primary",
                                // Active state with enhanced modern styling
                                "data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20",
                                // Enhanced active indicator with glow effect
                                "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:w-1 data-[active=true]:before:h-8 data-[active=true]:before:bg-primary data-[active=true]:before:rounded-r-full data-[active=true]:before:shadow-lg data-[active=true]:before:shadow-primary/50",
                                // Icon-only collapsed state with better spacing
                                "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl",
                                // Disabled states
                                "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                                // Enhanced icon and text styling
                                "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:transition-all [&>svg]:duration-300 [&>svg]:ease-out",
                                // Subtle border for better definition
                                "border border-transparent hover:border-sidebar-border/50 data-[active=true]:border-primary/30"
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
                            // Base styles with modern feel - matching main nav
                            "group/menu-item relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-left text-sm font-medium outline-none transition-all duration-300 ease-out",
                            // Focus and interaction states
                            "ring-sidebar-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/50",
                            // Hover effects with subtle animations and enhanced visual feedback
                            "hover:bg-gradient-to-r hover:from-sidebar-accent/80 hover:to-sidebar-accent/40 hover:text-sidebar-accent-foreground hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:translate-x-1",
                            // Icon animation on hover
                            "hover:[&>svg]:scale-110 hover:[&>svg]:rotate-3 hover:[&>svg]:text-primary",
                            // Active state with enhanced modern styling
                            "data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20",
                            // Enhanced active indicator with glow effect
                            "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:w-1 data-[active=true]:before:h-8 data-[active=true]:before:bg-primary data-[active=true]:before:rounded-r-full data-[active=true]:before:shadow-lg data-[active=true]:before:shadow-primary/50",
                            // Icon-only collapsed state with better spacing
                            "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl",
                            // Disabled states
                            "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                            // Enhanced icon and text styling
                            "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:transition-all [&>svg]:duration-300 [&>svg]:ease-out",
                            // Subtle border for better definition
                            "border border-transparent hover:border-sidebar-border/50 data-[active=true]:border-primary/30"
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
