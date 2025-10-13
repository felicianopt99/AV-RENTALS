
"use client";

import { useState, useRef, useEffect } from 'react';
import { RentalCalendarView } from '@/components/rentals/RentalCalendarView';
import { CalendarLegend } from '@/components/rentals/CalendarLegend';
import { CalendarFilters } from '@/components/rentals/CalendarFilters';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

export function CalendarContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const calendarRef = useRef<any>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({});
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:justify-end gap-4">
          <Button asChild className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
            <Link href="/events/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Event
            </Link>
          </Button>
        </div>
        <CalendarLegend />
        <div className="mb-4">
          <CalendarFilters
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        <RentalCalendarView
          searchQuery={searchQuery}
          filters={filters}
          calendarRef={calendarRef}
        />
      </div>
    </div>
  );
}
