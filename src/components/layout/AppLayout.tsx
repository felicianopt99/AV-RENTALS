
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
      <Sidebar variant="sidebar" collapsible="icon" className="backdrop-blur-xl border-r border-sidebar-border/50">
        <SidebarHeader className="p-4">
            <AppLogo />
        </SidebarHeader>
        <Separator className="mx-4 my-2 bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        <SidebarContent className="nav-scrollbar nav-mobile">
          <AppSidebarNav />
        </SidebarContent>
        <Separator className="mx-4 my-2 bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        <SidebarFooter className="p-4">
          <ClientOnly fallback={
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-sidebar-accent/30 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-sidebar-accent/20 rounded-lg animate-pulse" />
                  <div className="h-2 w-16 bg-sidebar-accent/10 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          }>
            {currentUser && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/20 border border-sidebar-border/50">
                  <div className="h-8 w-8 rounded-xl bg-sidebar-accent/40 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-sidebar-foreground/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-sidebar-foreground truncate">{currentUser.name}</div>
                    <div className="text-xs text-sidebar-foreground/60 capitalize">{currentUser.role}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
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

    