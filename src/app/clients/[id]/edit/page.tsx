
// src/app/clients/[id]/edit/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Client } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { ClientForm } from '@/components/clients/ClientForm';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTranslate } from '@/contexts/TranslationContext';
export default function EditClientPage() {
  // Translation hooks
  const { translated: uiEditClientDetailsText } = useTranslate('Edit Client Details');

  const params = useParams();
  const router = useRouter();
  const { clients, isDataLoaded } = useAppContext();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const clientId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
      } else {
        // Handle client not found, e.g., redirect or show error
        router.replace('/clients'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !clientId) {
        router.replace('/clients'); // No ID provided
        setLoading(false);
    }
  }, [clientId, clients, isDataLoaded, router]);

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading client data...</p>
            </div>
        </div>
    );
  }

  if (!client) {
     // This case should ideally be handled by the redirect, but as a fallback:
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">Client not found.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>{uiEditClientDetailsText}</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm initialData={client} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    