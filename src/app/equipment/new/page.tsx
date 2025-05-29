
"use client";

import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEquipmentPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Add New Equipment" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>New Equipment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
