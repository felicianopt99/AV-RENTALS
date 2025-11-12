"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { RentalForm } from '@/components/rentals/RentalForm';
import { format, parse } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { useTranslate } from '@/contexts/TranslationContext';
function NewRentalContent() {
  // Translation hooks
  const { translated: uiCreateRentalText } = useTranslate('Create Rental');
  const { translated: uiNewRentalText } = useTranslate('New Rental');
  const { translated: uiBacktoCalendarText } = useTranslate('Back to Calendar');
  
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      setSelectedDate(parsedDate);
    }
  }, [searchParams]);

  const handleCreateRental = () => {
    // TODO: Implement rental creation form and logic
    console.log('Create rental for date:', selectedDate);
    // For now, redirect back to calendar
    window.location.href = '/rentals/calendar';
  };

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/rentals/calendar">
              <ArrowLeft className="mr-2 h-4 w-4" /> {uiBacktoCalendarText}</Link>
          </Button>
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-4">{uiNewRentalText}</h2>
          {selectedDate && (
            <div className="mb-4 p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Selected Date: {format(selectedDate, 'MMMM dd, yyyy')}</p>
            </div>
          )}
          <p className="text-muted-foreground mb-6">TODO: Add form for selecting equipment, client, event, quantity, etc.</p>
          <Button onClick={handleCreateRental} className="w-full">
            {uiCreateRentalText}</Button>
        </div>
      </div>
    </div>
  );
}

export default function NewRentalPage() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRentalContent />
    </Suspense>
  );
}
