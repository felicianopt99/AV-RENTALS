
"use client";
import type React from 'react';
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
import { LogOut } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTopButton } from '@/components/ScrollToTopButton'; // Added import

export function AppLayout({ children }: { children: React.ReactNode }) {
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
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset>
        {/* AppHeader can be part of individual pages or a general one here */}
        {/* <AppHeader /> */} 
        <main className="flex-1 overflow-auto"> {/* Removed p-4 md:p-6 here, individual pages should handle padding if they have AppHeader */}
          {children}
        </main>
      </SidebarInset>
      <Toaster />
      <ScrollToTopButton /> {/* Added ScrollToTopButton */}
    </SidebarProvider>
  );
}
