"use client";

import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { useTranslate } from '@/contexts/TranslationContext';

export default function NewEquipmentPage() {
  // Translation hooks
  const { translated: uiAddNewEquipmentText } = useTranslate('Add New Equipment');

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{uiAddNewEquipmentText}</h1>
        <EquipmentForm />
      </div>
    </div>
  );
}