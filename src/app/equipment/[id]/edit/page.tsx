"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EquipmentItem } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTranslate } from '@/contexts/TranslationContext';
export default function EditEquipmentPage() {
  // Translation hooks
  const { translated: uiEditEquipmentText } = useTranslate('Edit Equipment');

  const params = useParams();
  const router = useRouter();
  const { equipment, isDataLoaded } = useAppContext();
  const [equipmentItem, setEquipmentItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const itemId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && itemId) {
      const foundItem = equipment.find((e: EquipmentItem) => e.id === itemId);
      if (foundItem) {
        setEquipmentItem(foundItem);
      } else {
        // Equipment not found, redirect back
        router.push('/inventory');
        return;
      }
      setLoading(false);
    }
  }, [itemId, equipment, isDataLoaded, router]);

  if (loading || !isDataLoaded) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading equipment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!equipmentItem) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <div className="text-center">
            <p className="text-lg text-destructive">Equipment not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{uiEditEquipmentText}</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentForm
              initialData={equipmentItem}
              onSubmitSuccess={() => router.push('/inventory')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
