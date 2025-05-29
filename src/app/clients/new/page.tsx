
// src/app/clients/new/page.tsx
"use client";

import { ClientForm } from '@/components/clients/ClientForm';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewClientPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Add New Client" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>New Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
