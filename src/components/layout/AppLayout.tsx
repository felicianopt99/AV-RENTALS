
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
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/types';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <SidebarProvider defaultOpen>
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
            {isClient && currentUser ? (
            <div className="p-2 space-y-2">
                <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold text-sm">{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto px-2 py-0.5 rounded-full bg-primary/10">{currentUser.role}</span>
                </div>
            </div>
            ) : (
             <div className="p-2 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded-md animate-pulse" />
                </div>
            </div>
            )}
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
      <ScrollToTopButton />
    </SidebarProvider>
  );
}

    