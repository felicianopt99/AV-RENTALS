"use client";

import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Routes that should not have the main app layout
  const noLayoutRoutes = ['/login'];
  
  const shouldShowLayout = !noLayoutRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (shouldShowLayout) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <>{children}</>;
}