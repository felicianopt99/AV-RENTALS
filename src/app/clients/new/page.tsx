
// src/app/clients/new/page.tsx
"use client";

import { ClientForm } from '@/components/clients/ClientForm';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTranslate } from '@/contexts/TranslationContext';
export default function NewClientPage() {
  // Translation hooks
  const { translated: uiNewClientDetailsText } = useTranslate('New Client Details');

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>{uiNewClientDetailsText}</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
