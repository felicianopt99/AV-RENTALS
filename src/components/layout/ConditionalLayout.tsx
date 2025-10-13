"use client";

import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Routes that should not have the main app layout
  const noLayoutRoutes = ['/login'];
  
  const shouldShowLayout = !noLayoutRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  // Use the mobile-first layout for both phones and tablets
  if (isMobile || isTablet) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <AppLayout>{children}</AppLayout>;
}