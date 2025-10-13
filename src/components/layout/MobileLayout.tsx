"use client";
import type React from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { MobileNavProvider } from '@/contexts/MobileNavContext';

import { MobileWelcomeBar } from '@/components/layout/MobileWelcomeBar';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <div className="flex flex-col h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden relative">
        <AppHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[160px] md:pb-0 min-w-0 max-w-full bg-white dark:bg-black relative z-[1]">
          <div className="page-container">
            <MobileWelcomeBar />
            {children}
          </div>
        </main>
        <Toaster />
        <ScrollToTopButton />
        <BottomNav />
      </div>
    </MobileNavProvider>
  );
}
