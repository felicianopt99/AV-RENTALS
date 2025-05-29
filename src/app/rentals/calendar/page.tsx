
"use client";

import { RentalCalendarView } from '@/components/rentals/RentalCalendarView';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function RentalCalendarPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Rental Calendar" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-6 flex justify-end">
          <Link href="/rentals/new" passHref>
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Rental
            </Button>
          </Link>
        </div>
        <RentalCalendarView />
      </div>
    </div>
  );
}
