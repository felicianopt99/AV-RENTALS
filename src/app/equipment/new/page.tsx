
"use client";

import { EquipmentForm } from '@/components/equipment/EquipmentForm';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTranslate } from '@/contexts/TranslationContext';
export default function NewEquipmentPage() {
  // Translation hooks
  const { translated: uiNewEquipmentDetailsText } = useTranslate('New Equipment Details');

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>{uiNewEquipmentDetailsText}</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
