"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, UserCircle, LogOut, User } from 'lucide-react';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { useTranslate } from '@/contexts/TranslationContext';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/types';
import { ClientOnly, useIsClient } from '@/hooks/useIsClient';
import { LanguageToggle } from '@/components/LanguageToggle';

interface AppHeaderProps {
  title?: string;
  children?: React.ReactNode; // Added children prop to allow nested elements
  className?: string; // Added className prop to allow custom styling
}

export function AppHeader({ title, children, className }: AppHeaderProps) {
  const { currentUser, isAuthenticated } = useAppContext();
  const { logout } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isClient = useIsClient();

  // Translation hooks
  const { translated: notificationsText } = useTranslate('Notifications');
  const { translated: noNotificationsText } = useTranslate('No notifications');
  const { translated: profileText } = useTranslate('Profile');
  const { translated: logoutText } = useTranslate('Logout');

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetch(`/api/notifications?limit=20`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          const notifs = (data.notifications || []) as Notification[];
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.isRead).length);
        })
        .catch(err => {
          console.error('Failed to fetch notifications:', err);
          // Don't show error to user, just log it
          if (err.message.includes('NetworkError') || err.message === 'Failed to fetch') {
            console.warn('Network error when fetching notifications - this is likely temporary');
          }
        });
    }
  }, [isAuthenticated, currentUser]);

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



  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
        // Silently fail on network errors - don't show error to user
        console.warn('Network error when marking notification as read - this is likely temporary');
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-[9999] flex h-16 items-center justify-between px-6 pt-[env(safe-area-inset-top)] w-full glass-header ${className}`}
    >
      {/* Left side - Profile (only on mobile) - Always render container for consistent layout */}
  <div className="flex items-center gap-1 flex-1 justify-start">
        <ClientOnly>
          {isAuthenticated && (
            <div className="md:hidden">
              {/* Profile Dropdown - Mobile Only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                    <UserCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="sr-only">Profile menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[99999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/20 dark:border-gray-700/20" align="start">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                      <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                        {currentUser?.username}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="w-fit mt-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      >
                        {currentUser?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <User className="mr-2 h-4 w-4" />
                    {profileText}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                  <DropdownMenuItem onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutText}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </ClientOnly>
      </div>

      {/* Center - Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-base font-medium truncate text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      {/* Left side - Profile (only on mobile) - Always render container for consistent layout */}
      <div className="flex items-center gap-1 flex-1 justify-start">
        {isClient && isAuthenticated && (
          <div className="md:hidden">
            {/* Profile Dropdown - Mobile Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                  <UserCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="sr-only">Profile menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 z-[99999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/20 dark:border-gray-700/20" align="start">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                    <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                      {currentUser?.username}
                    </p>
                    <Badge 
                      variant="outline" 
                      className="w-fit mt-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                    >
                      {currentUser?.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                <DropdownMenuItem onClick={() => router.push('/profile')} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <User className="mr-2 h-4 w-4" />
                  {profileText}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                <DropdownMenuItem onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutText}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Center - Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-base font-medium truncate text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      
      {/* Custom children content */}
      {children && <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">{children}</div>}
      
  {/* Right side - Notifications (always visible when authenticated) - Always render container for consistent layout */}
  <div className="flex items-center gap-1 flex-1 justify-end sticky top-0 z-[10000]">
        <ClientOnly>
          <LanguageToggle />
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-lg">
                  <Bell className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center font-medium border-2 border-white dark:border-black">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">{notificationsText}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto z-[10000] bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl sticky top-16 rounded-xl" align="end" style={{backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)'}}>
                <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">{notificationsText}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {noNotificationsText}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="flex items-start p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{notification.title}</span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ClientOnly>
      </div>
    </header>
  );
}
