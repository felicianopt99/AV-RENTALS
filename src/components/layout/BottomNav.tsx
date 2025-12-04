"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { navItems as baseNavItems, adminItems } from '@/components/layout/navConfig';
import { 
  Home, 
  Package, 
  CalendarDays, 
  Wrench, 
  Users, 
  FileText, 
  MoreHorizontal,
  Settings,
  Shield,
  Palette,
  FileType,
  Languages
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the most important items that should always be visible
const MAIN_NAV_ITEMS = ['Dashboard', 'Inventory', 'Rentals'];

// Map of icon names to actual icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: Home,
  Inventory: Package,
  Rentals: CalendarDays,
  Maintenance: Wrench,
  Clients: Users,
  Quotes: FileText,
  'User Management': Shield,
  'Translation Management': Languages,
  'Customization': Palette,
  'PDF Branding': FileType,
  'System Settings': Settings,
};

interface NavItem {
  href?: string;
  label: string;
  icon?: any;
  requiredRole: string[];
  subItems?: Array<{ href: string; label: string }>;
}

export function BottomNav() {
  const { currentUser } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const { t: translated } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Get visible nav items based on user role
  const visibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    const role = String(currentUser.role || 'viewer').toLowerCase();
    return baseNavItems.filter(item => 
      item.requiredRole.map(r => String(r).toLowerCase()).includes(role)
    );
  }, [currentUser]);

  // Get visible admin items based on user role
  const visibleAdminItems = useMemo(() => {
    if (!currentUser) return [];
    const role = String(currentUser.role || 'viewer').toLowerCase();
    return adminItems.filter(item => 
      item.requiredRole.map(r => String(r).toLowerCase()).includes(role)
    );
  }, [currentUser]);

  // Separate main nav items and more items
  const { mainNavItems, moreNavItems } = useMemo(() => {
    const main: NavItem[] = [];
    const more: NavItem[] = [];

    visibleNavItems.forEach(item => {
      if (MAIN_NAV_ITEMS.includes(item.label)) {
        main.push(item);
      } else {
        more.push(item);
      }
    });

    return { mainNavItems: main, moreNavItems: more };
  }, [visibleNavItems]);

  const isActive = (href: string) => {
    if (!href) return false;
    if (href === '/dashboard') {
      return pathname === '/' || pathname?.startsWith('/dashboard');
    }
    return pathname?.startsWith(href);
  };

  const getEffectiveHref = (item: NavItem): string | undefined => 
    item.href || (item.subItems?.[0]?.href);

  const handleNavClick = (item: NavItem) => {
    const href = getEffectiveHref(item);
    if (href) {
      router.push(href);
    }
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const href = getEffectiveHref(item);
    const active = href ? isActive(href) : false;
    const Icon = item.icon || (iconMap[item.label] || (() => null));
    
    return (
      <button
        key={item.label}
        onClick={() => handleNavClick(item)}
        className={cn(
          'flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors',
          'text-sm font-medium',
          active 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-foreground',
          isMobile ? 'px-2' : 'px-3'
        )}
      >
        <Icon className="h-5 w-5 mb-1" />
        <span className="text-xs">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Main navigation items */}
        {mainNavItems.map(item => renderNavItem(item, true))}
        
        {/* More menu */}
        <DropdownMenu open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                'flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors',
                'text-sm font-medium',
                isMoreOpen 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground',
                'px-2'
              )}
            >
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="text-xs">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-screen max-w-[280px] rounded-t-xl rounded-br-xl mb-2 mx-2 p-2"
            side="top"
            align="center"
          >
            {/* More navigation items */}
            {moreNavItems.map(item => (
              <DropdownMenuItem 
                key={item.label}
                onClick={() => handleNavClick(item)}
                className="w-full cursor-pointer"
              >
                {renderNavItem(item)}
              </DropdownMenuItem>
            ))}

            {/* Admin section */}
            {visibleAdminItems.length > 0 && (
              <>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuLabel className="px-2 text-xs font-medium text-muted-foreground">
                  Admin
                </DropdownMenuLabel>
                {visibleAdminItems.map(item => (
                  <DropdownMenuItem 
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className="w-full cursor-pointer"
                  >
                    {renderNavItem(item)}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
