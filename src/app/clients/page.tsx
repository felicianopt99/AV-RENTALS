
// src/app/clients/page.tsx
"use client";

import { ClientListDisplay } from '@/components/clients/ClientListDisplay';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ClientsPage() {
  const { currentUser } = useAppContext();

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col h-full">
        <AppHeader title="Client Management" />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
            <Card className="max-w-lg w-full bg-destructive/10 border-destructive/30">
                <CardHeader className="flex-row gap-4 items-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <div>
                        <CardTitle className="text-destructive">Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Client Management" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <ClientListDisplay />
      </div>
    </div>
  );
}
