
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, UserCircle, LogOut, User } from 'lucide-react';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { currentUser, isAuthenticated } = useAppContext();
  const { logout } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Manager': return 'bg-blue-100 text-blue-800';
      case 'Technician': return 'bg-green-100 text-green-800';
      case 'Employee': return 'bg-yellow-100 text-yellow-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
      <SidebarTrigger className="sm:hidden" />
      {title && <h1 className="text-xl font-semibold">{title}</h1>}
      <div className="ml-auto flex items-center gap-4">
        {isClient && isAuthenticated && currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className="font-medium">{currentUser.name}</span>
              <Badge className={getRoleBadgeColor(currentUser.role)}>
                {currentUser.role}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{currentUser.name}</span>
                    <span className="text-sm text-gray-500">@{currentUser.username}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden">
                  <User className="mr-2 h-4 w-4" />
                  <span>Role: {currentUser.role}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="w-[180px] h-10 bg-muted rounded-md animate-pulse" />
        )}
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-5 w-5" />
          <span className="sr-only">User Profile</span>
        </Button>
      </div>
    </header>
  );
}

    