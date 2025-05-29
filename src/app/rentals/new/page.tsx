
"use client";

import { RentalForm } from '@/components/rentals/RentalForm';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewRentalPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Create New Rental" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>New Rental Details</CardTitle>
          </CardHeader>
          <CardContent>
            <RentalForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
