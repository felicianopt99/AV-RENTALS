"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useAppContext } from '@/contexts/AppContext';
import { navItems as baseNavItems } from '@/components/layout/navConfig';

// We’ll derive visible items based on role from the shared config

export function BottomNav() {
  const { activeIndex, setActiveIndex } = useMobileNav();
  const pathname = usePathname();
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAppContext();
  const navRef = useRef<HTMLDivElement | null>(null);

  const visibleNavItems = useMemo(() => {
    const role = (currentUser?.role as string) || 'Viewer';
    const filtered = (baseNavItems || []).filter(i => (i.requiredRole || []).includes(role as any));
    // If filtering produced no items (e.g., unknown role or loading), show all base items as a safe fallback
    return filtered.length > 0 ? filtered : (baseNavItems || []);
  }, [currentUser?.role]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname?.startsWith('/dashboard');
    }
    return pathname?.startsWith(href);
  };

  const getEffectiveHref = (item: any): string | undefined => item.href || item.subItems?.[0]?.href;

  // Active parent contains either a direct href hit or a subitem hit
  const activeParentIndex = useMemo(() => {
    const idx = visibleNavItems.findIndex(i => {
      const href = getEffectiveHref(i);
      const parentHit = href ? isActive(href) : false;
      const childHit = i.subItems?.some((s: any) => pathname?.startsWith(s.href));
      return !!(parentHit || childHit);
    });
    return idx === -1 ? 0 : idx;
  }, [visibleNavItems, pathname]);

  const activeParent = visibleNavItems[activeParentIndex];
  const childIndex = useMemo(() => {
    if (!activeParent?.subItems) return -1;
    return activeParent.subItems.findIndex((s: any) => pathname?.startsWith(s.href));
  }, [activeParent, pathname]);

  const goToParentIndex = (idx: number) => {
    const bounded = Math.max(0, Math.min(idx, visibleNavItems.length - 1));
    const target = visibleNavItems[bounded];
    const href = getEffectiveHref(target);
    if (!href) return;
    triggerHaptic('selection');
    router.push(href);
  };

  const goToChildIndex = (pIdx: number, cIdx: number) => {
    const parent = visibleNavItems[pIdx];
    const target = parent?.subItems?.[cIdx];
    if (!target) return;
    triggerHaptic('selection');
    router.push(target.href);
  };

  // Swipe handling: child first, then parent
  useEffect(() => {
    let manager: any | null = null;
    let globalManager: any | null = null;
    let mounted = true;

    const setup = async () => {
      if (typeof window === 'undefined' || !navRef.current) return;
      const { default: Hammer } = await import('hammerjs');
      if (!mounted || !navRef.current) return;

      manager = new Hammer.Manager(navRef.current);
      globalManager = new Hammer.Manager(document.body as unknown as HTMLElement);

      const swipeLocal = new Hammer.Swipe({ direction: Hammer.DIRECTION_HORIZONTAL, velocity: 0.25, threshold: 10 });
      const swipeGlobal = new Hammer.Swipe({ direction: Hammer.DIRECTION_HORIZONTAL, velocity: 0.25, threshold: 10 });
      manager.add(swipeLocal);
      globalManager.add(swipeGlobal);

      const handleSwipeLeft = () => {
        if (activeParent?.subItems && childIndex >= 0 && childIndex < activeParent.subItems.length - 1) {
          goToChildIndex(activeParentIndex, childIndex + 1);
        } else {
          goToParentIndex(activeParentIndex + 1);
        }
      };

      const handleSwipeRight = () => {
        if (activeParent?.subItems && childIndex > 0) {
          goToChildIndex(activeParentIndex, childIndex - 1);
        } else {
          goToParentIndex(activeParentIndex - 1);
        }
      };

      manager.on('swipeleft', handleSwipeLeft);
      manager.on('swiperight', handleSwipeRight);
      globalManager.on('swipeleft', handleSwipeLeft);
      globalManager.on('swiperight', handleSwipeRight);
    };

    setup();

    return () => {
      mounted = false;
      try {
        manager?.destroy();
        globalManager?.destroy();
      } catch {}
    };
  }, [activeParentIndex, activeParent, childIndex]);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] overflow-x-hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      aria-label="Primary"
    >
      <div
        ref={navRef}
        className={cn(
          // Make the bar centered and properly positioned
          "pointer-events-auto w-[90%] max-w-sm mx-auto overflow-x-hidden",
          "rounded-2xl",
          "bg-white/80 dark:bg-black/80 backdrop-blur-xl",
          "shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
          "touch-pan-y"
        )}
        style={{ marginBottom: '12px' }}
      >
        <div className="flex justify-around items-end gap-0.5 px-3 py-2.5">
          {visibleNavItems.map((item, index) => {
            const href = getEffectiveHref(item);
            const active = href ? isActive(href) || item.subItems?.some((s: any) => pathname?.startsWith(s.href)) : item.subItems?.some((s: any) => pathname?.startsWith(s.href));
            return (
              <div key={(item.href || item.label)} className="relative flex-1">
                {/* active pill */}
                <div
                  className={cn(
                    "absolute inset-x-1 -top-0.5 h-10 rounded-xl transition-all duration-200",
                    active ? "bg-gray-100/50 dark:bg-gray-800/50" : "bg-transparent"
                  )}
                  aria-hidden
                />
                <Link
                  href={href || '#'}
                  prefetch={false}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    if (!href) return;
                    if (active && !item.subItems) return;
                    setActiveIndex(index);
                    triggerHaptic('selection');
                    e.preventDefault();
                    router.push(href);
                  }}
                  className={cn(
                    "relative z-10 mx-auto flex h-11 flex-col items-center justify-center",
                    "min-w-[52px] rounded-xl px-2 text-[10px] font-medium transition-all duration-200",
                    active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
                    "active:scale-95"
                  )}
                >
                  {item.icon && <item.icon className={cn("h-4 w-4 transition-all duration-200", active && "scale-105")} />}
                  <span className="mt-1.5 leading-none">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
        {/* Slide-up submenu when active tab has children */}
        {activeParent?.subItems && activeParent.subItems.length > 0 && (
          <div className="px-3 pb-2">
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex justify-center gap-1.5 px-1 py-1 animate-[submenu_250ms_ease-out] min-w-full">
                {activeParent.subItems.map((sub) => {
                  const subActive = pathname?.startsWith(sub.href);
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={(e) => {
                        if (subActive) return;
                        triggerHaptic('selection');
                        e.preventDefault();
                        router.push(sub.href);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-medium whitespace-nowrap transition-all duration-200 active:scale-95",
                        subActive ? "text-gray-900 dark:text-gray-100 bg-gray-100/50 dark:bg-gray-800/50" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      )}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Dots indicating child position */}
            <div className="mt-1 flex items-center justify-center gap-1">
              {activeParent.subItems.map((sub, i) => {
                const activeDot = childIndex === i || (childIndex === -1 && i === 0);
                return (
                  <span
                    key={sub.href}
                    className={cn(
                      "block h-1 w-1 rounded-full transition-all duration-200",
                      activeDot ? "bg-gray-900 dark:bg-gray-100 w-2" : "bg-gray-400/40 dark:bg-gray-600/40"
                    )}
                    aria-hidden
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
