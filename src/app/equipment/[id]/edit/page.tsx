// src/app/equipment/[id]/edit/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EquipmentItem } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const { equipment, isDataLoaded } = useAppContext();
  const [item, setItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const itemId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && itemId) {
      const foundItem = equipment.find(e => e.id === itemId);
      if (foundItem) {
        setItem(foundItem);
      } else {
        // Handle item not found, e.g., redirect or show error
        router.replace('/'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !itemId) {
        router.replace('/'); // No ID provided
        setLoading(false);
    }
  }, [itemId, equipment, isDataLoaded, router]);

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Edit Equipment" />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading equipment data...</p>
            </div>
        </div>
    );
  }

  if (!item) {
     // This case should ideally be handled by the redirect, but as a fallback:
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Edit Equipment" />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-destructive">Equipment not found.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={`Edit Equipment: ${item.name}`} />
      <div className="p-4 md:p-6">
        <Card className="max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>Edit Equipment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentForm initialData={item} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
