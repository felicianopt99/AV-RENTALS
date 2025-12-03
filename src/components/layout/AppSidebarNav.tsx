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
import { useTranslate } from '@/components/translation/TranslatedComponents';
import { PreloadTranslations, NavigationTranslations } from '@/components/translation/TranslatedComponents';

// Component to translate nav labels
function NavLabel({ text }: { text: string }) {
  const { translated } = useTranslate(text);
  return <>{translated}</>;
}

export function AppSidebarNav() {
  const pathname = usePathname();
  const { currentUser, isDataLoaded } = useAppContext();
  const { state: sidebarState, isMobile, toggleSidebar } = useSidebar();

  // Preload all navigation translations
  const navLabels = useMemo(() => {
    const labels = [...baseNavItems.map(i => i.label), ...baseAdminItems.map(i => i.label)];
    baseNavItems.forEach(item => {
      if (item.subItems) {
        item.subItems.forEach(sub => labels.push(sub.label));
      }
    });
    return labels;
  }, []);

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
    const normalizedRole = String(currentUser?.role || 'viewer').toLowerCase();
    const items = baseNavItems.filter(item => (item.requiredRole || []).map(r => String(r).toLowerCase()).includes(normalizedRole));
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
        <PreloadTranslations texts={navLabels} />
        <SidebarMenu>
          {visibleNavItems.map((item, index) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isParentActive = item.href ? ((item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
            const isSubActive = hasSub && item.subItems!.some(sub => pathname.startsWith(sub.href));
            const parentActive = isParentActive || isSubActive;
            const linkClass = cn(
              // Modern minimal base styles
              "group/menu-item relative flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left text-sm font-medium outline-none transition-all duration-200 ease-out",
              // Focus states
              "ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500/30",
              // Subtle hover effects
              "hover:bg-blue-50/80 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300",
              // Minimal icon animation
              "hover:[&>svg]:text-blue-600 dark:hover:[&>svg]:text-blue-400",
              // Clean active state
              "data-[active=true]:bg-blue-100/80 dark:data-[active=true]:bg-blue-900/50 data-[active=true]:text-blue-700 dark:data-[active=true]:text-blue-300 data-[active=true]:font-medium",
              // Subtle active indicator
              "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:w-0.5 data-[active=true]:before:h-6 data-[active=true]:before:bg-blue-600 dark:data-[active=true]:before:bg-blue-400 data-[active=true]:before:rounded-r-sm",
              // Icon-only collapsed state
              "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg",
              // Disabled states
              "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
              // Icon and text styling
              "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:ease-out data-[active=true]:[&>svg]:text-blue-600 dark:data-[active=true]:[&>svg]:text-blue-400",
              // Minimal border
              "border border-transparent hover:border-blue-200/60 dark:hover:border-blue-800/60 data-[active=true]:border-blue-300/60 dark:data-[active=true]:border-blue-700/60"
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
                      <span className="flex-1"><NavLabel text={item.label} /></span>
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
                      <span className="flex-1"><NavLabel text={item.label} /></span>
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
                              "flex w-full items-center gap-2 rounded-md p-2 text-sm transition-all duration-200 ease-out",
                              "hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400",
                              isSubActive 
                                ? "bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium" 
                                : "text-sidebar-foreground/70 hover:text-blue-600 dark:hover:text-blue-400"
                            )}
                          >
                            <div className="h-2 w-2 rounded-full bg-current opacity-50" />
                            <span><NavLabel text={sub.label} /></span>
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

  {String(currentUser?.role || '').toLowerCase() === 'admin' && (
          <>
            <div className="px-4 py-4">
              <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent"></div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 px-3 pb-3 tracking-wider uppercase">
                <NavLabel text="Administration" />
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
                                // Modern minimal base styles - matching main nav
                                "group/menu-item relative flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left text-sm font-medium outline-none transition-all duration-200 ease-out",
                                // Focus states
                                "ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500/30",
                                // Subtle hover effects
                                "hover:bg-blue-50/80 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300",
                                // Minimal icon animation
                                "hover:[&>svg]:text-blue-600 dark:hover:[&>svg]:text-blue-400",
                                // Clean active state
                                "data-[active=true]:bg-blue-100/80 dark:data-[active=true]:bg-blue-900/50 data-[active=true]:text-blue-700 dark:data-[active=true]:text-blue-300 data-[active=true]:font-medium",
                                // Subtle active indicator
                                "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:w-0.5 data-[active=true]:before:h-6 data-[active=true]:before:bg-blue-600 dark:data-[active=true]:before:bg-blue-400 data-[active=true]:before:rounded-r-sm",
                                // Icon-only collapsed state
                                "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg",
                                // Disabled states
                                "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                                // Icon and text styling
                                "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:ease-out data-[active=true]:[&>svg]:text-blue-600 dark:data-[active=true]:[&>svg]:text-blue-400",
                                // Minimal border
                                "border border-transparent hover:border-blue-200/60 dark:hover:border-blue-800/60 data-[active=true]:border-blue-300/60 dark:data-[active=true]:border-blue-700/60"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                              <span className="flex-1"><NavLabel text={item.label} /></span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-48">
                            <p><NavLabel text={item.label} /></p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={href}
                          data-sidebar="menu-button"
                          data-size="default"
                          data-active={isActive}
                          className={cn(
                            // Modern minimal base styles - matching main nav
                            "group/menu-item relative flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left text-sm font-medium outline-none transition-all duration-200 ease-out",
                            // Focus states
                            "ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500/30",
                            // Subtle hover effects
                            "hover:bg-blue-50/80 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300",
                            // Minimal icon animation
                            "hover:[&>svg]:text-blue-600 dark:hover:[&>svg]:text-blue-400",
                            // Clean active state
                            "data-[active=true]:bg-blue-100/80 dark:data-[active=true]:bg-blue-900/50 data-[active=true]:text-blue-700 dark:data-[active=true]:text-blue-300 data-[active=true]:font-medium",
                            // Subtle active indicator
                            "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:w-0.5 data-[active=true]:before:h-6 data-[active=true]:before:bg-blue-600 dark:data-[active=true]:before:bg-blue-400 data-[active=true]:before:rounded-r-sm",
                            // Icon-only collapsed state
                            "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg",
                            // Disabled states
                            "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                            // Icon and text styling
                            "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:ease-out data-[active=true]:[&>svg]:text-blue-600 dark:data-[active=true]:[&>svg]:text-blue-400",
                            // Minimal border
                            "border border-transparent hover:border-blue-200/60 dark:hover:border-blue-800/60 data-[active=true]:border-blue-300/60 dark:data-[active=true]:border-blue-700/60"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="flex-1"><NavLabel text={item.label} /></span>
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
