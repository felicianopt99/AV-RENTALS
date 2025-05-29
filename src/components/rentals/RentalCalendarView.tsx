"use client";

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Rental } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export function RentalCalendarView() {
  const { rentals, equipment } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const rentalsForSelectedDate = selectedDate
    ? rentals.filter(rental => 
        isWithinInterval(selectedDate, { start: startOfDay(new Date(rental.startDate)), end: endOfDay(new Date(rental.endDate)) })
      )
    : [];

  // Create modifiers for react-day-picker to highlight dates with rentals
  const rentalDateModifiers = rentals.reduce((acc, rental) => {
    const start = startOfDay(new Date(rental.startDate));
    const end = endOfDay(new Date(rental.endDate));
    
    // Create a range of dates for the rental
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      if (!acc[dateString]) {
        acc[dateString] = { rented: true, equipmentIds: new Set() };
      }
      acc[dateString].equipmentIds.add(rental.equipmentId);
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    return acc;
  }, {} as Record<string, { rented: boolean, equipmentIds: Set<string> }>);

  const modifiers = {
    rented: Object.keys(rentalDateModifiers)
                  .filter(dateStr => rentalDateModifiers[dateStr].rented)
                  .map(dateStr => parseISO(dateStr)), // Make sure to parse string back to Date
  };

  const modifiersStyles = {
    rented: {
      backgroundColor: 'hsl(var(--primary) / 0.3)', // Use primary color with opacity
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '2px',
    }
  };
  
  // Conflict detection for display purposes
  const conflicts: { date: Date, equipmentId: string, count: number, equipmentName: string }[] = [];
  const dailyRentalCounts: Record<string, Record<string, number>> = {}; // date -> equipmentId -> count

  rentals.forEach(rental => {
    let currentDate = startOfDay(new Date(rental.startDate));
    const endDate = endOfDay(new Date(rental.endDate));
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (!dailyRentalCounts[dateStr]) dailyRentalCounts[dateStr] = {};
      if (!dailyRentalCounts[dateStr][rental.equipmentId]) dailyRentalCounts[dateStr][rental.equipmentId] = 0;
      dailyRentalCounts[dateStr][rental.equipmentId] += rental.quantityRented;
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
  });
  
  Object.entries(dailyRentalCounts).forEach(([dateStr, equipmentCounts]) => {
    Object.entries(equipmentCounts).forEach(([equipmentId, count]) => {
      const eq = equipment.find(e => e.id === equipmentId);
      if (eq && count > eq.quantity) {
        conflicts.push({ date: parseISO(dateStr), equipmentId, count, equipmentName: eq.name });
      }
    });
  });

  const conflictDates = conflicts.map(c => c.date);
  const conflictModifiers = {
    conflict: conflictDates,
  };
  const conflictModifiersStyles = {
    conflict: {
      backgroundColor: 'hsl(var(--destructive) / 0.4)',
      color: 'hsl(var(--destructive-foreground))',
      fontWeight: 'bold',
      borderRadius: '2px',
    }
  };


  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Equipment Rental Calendar</CardTitle>
            <CardDescription>Select a date to see active rentals. Dates with rentals are highlighted. Dates with conflicts are marked in red.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border p-0"
              modifiers={{ ...modifiers, ...conflictModifiers }}
              modifiersStyles={{...modifiersStyles, ...conflictModifiersStyles}}
            />
          </CardContent>
        </Card>
        {conflicts.length > 0 && (
          <Card className="mt-6 shadow-lg bg-destructive/10 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" /> Potential Overbooking Conflicts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40">
                <ul className="space-y-1 text-sm">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>
                      {format(conflict.date, "PPP")}: <strong>{conflict.equipmentName}</strong> overbooked (Rented: {conflict.count} / Available: {equipment.find(e => e.id === conflict.equipmentId)?.quantity || 'N/A'})
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="md:col-span-1">
        <Card className="shadow-lg h-full">
          <CardHeader>
            <CardTitle>
              Rentals for {selectedDate ? format(selectedDate, "PPP") : 'No Date Selected'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rentalsForSelectedDate.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-350px)]"> {/* Adjust height as needed */}
                <ul className="space-y-3">
                  {rentalsForSelectedDate.map(rental => (
                    <li key={rental.id} className="p-3 border rounded-md bg-card-foreground/5">
                      <p className="font-semibold">{rental.equipmentName} <Badge variant="secondary" className="ml-1">Qty: {rental.quantityRented}</Badge></p>
                      <p className="text-xs text-muted-foreground">Client: {rental.clientName}</p>
                      <p className="text-xs text-muted-foreground">Event: {rental.eventLocation}</p>
                      <p className="text-xs text-muted-foreground">
                        Period: {format(new Date(rental.startDate), "PP")} - {format(new Date(rental.endDate), "PP")}
                      </p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No rentals scheduled for this date.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
