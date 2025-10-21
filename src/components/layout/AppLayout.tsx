
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarInset,
  SidebarRail
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/AppLogo';
import { AppSidebarNav } from '@/components/layout/AppSidebarNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientOnly } from '@/hooks/useIsClient';
import type { User } from '@/types';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  const { logout } = useAppDispatch();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    }
  };


  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
            <AppLogo />
        </SidebarHeader>
        <Separator className="my-2" />
        <SidebarContent>
          <AppSidebarNav />
        </SidebarContent>
        <Separator className="my-2" />
        <SidebarFooter>
          <ClientOnly fallback={
            <div className="p-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded-md animate-pulse" />
              </div>
            </div>
          }>
            {currentUser && (
              <div className="p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-sm">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto px-2 py-0.5 rounded-full bg-primary/10">{currentUser.role}</span>
                </div>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </ClientOnly>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0 min-h-0 min-w-0 max-w-full px-3 sm:px-4 md:px-6">
          <div className="page-container">
            {children}
          </div>
        </main>
      </SidebarInset>
      <Toaster />
      <ScrollToTopButton />
      
    </SidebarProvider>
  );
}

    