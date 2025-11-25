
// src/components/clients/ClientsContent.tsx
"use client";

import { ClientListDisplay } from '@/components/clients/ClientListDisplay';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useTranslate } from '@/contexts/TranslationContext';

export function ClientsContent() {
  const { currentUser } = useAppContext();

  // Translation hooks
  const { translated: accessDeniedText } = useTranslate('Access Denied');
  const { translated: noPermissionText } = useTranslate('You do not have permission to view this page.');

  // Allow Admin, Manager, and Employee to access clients (matches navigation)
  const allowedRoles = ['Admin', 'Manager', 'Employee'];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex flex-col min-h-screen">

        <div className="flex-1 overflow-y-auto p-2 md:p-6 flex items-center justify-center">
            <Card className="max-w-lg w-full bg-destructive/10 border-destructive/30">
                <CardHeader className="flex-row gap-4 items-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <div>
                        <CardTitle className="text-destructive">{accessDeniedText}</CardTitle>
                        <CardDescription>{noPermissionText}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <ClientListDisplay />
      </div>
    </div>
  );
}
