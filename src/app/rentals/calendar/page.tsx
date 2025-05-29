
"use client";

import { RentalCalendarView } from '@/components/rentals/RentalCalendarView';
import { AppHeader } from '@/components/layout/AppHeader';

export default function RentalCalendarPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Rental Calendar" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <RentalCalendarView />
      </div>
    </div>
  );
}
