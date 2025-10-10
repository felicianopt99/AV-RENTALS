
"use client";

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, UserCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { users, currentUser, setCurrentUser } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUserChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if(user) {
      setCurrentUser(user);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
      <SidebarTrigger className="sm:hidden" />
      {title && <h1 className="text-xl font-semibold">{title}</h1>}
      <div className="ml-auto flex items-center gap-4">
        {isClient && currentUser ? (
           <Select onValueChange={handleUserChange} value={currentUser.id}>
              <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Switch User..." />
              </SelectTrigger>
              <SelectContent>
                  {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
                  ))}
              </SelectContent>
          </Select>
        ) : (
          <div className="w-[180px] h-10" /> // Placeholder to prevent layout shift
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
