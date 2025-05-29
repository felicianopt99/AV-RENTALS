
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import type { Rental, EquipmentItem } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export function RentalCalendarView() {
  const { rentals, equipment, isDataLoaded } = useAppContext();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Set initial date only on client after mount to avoid hydration mismatch
    setSelectedDate(new Date());
  }, []);

  const rentalsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return rentals.filter(rental => 
        isWithinInterval(selectedDate, { start: startOfDay(new Date(rental.startDate)), end: endOfDay(new Date(rental.endDate)) })
      );
  }, [selectedDate, rentals]);

  const rentalDateModifiers = useMemo(() => {
    return rentals.reduce((acc, rental) => {
      const start = startOfDay(new Date(rental.startDate));
      const end = endOfDay(new Date(rental.endDate));
      
      let currentDateLoop = new Date(start);
      while (currentDateLoop <= end) {
        const dateString = format(currentDateLoop, 'yyyy-MM-dd');
        if (!acc[dateString]) {
          acc[dateString] = { rented: true };
        }
        currentDateLoop = new Date(currentDateLoop.setDate(currentDateLoop.getDate() + 1));
      }
      return acc;
    }, {} as Record<string, { rented: boolean }>);
  }, [rentals]);

  const modifiers = {
    rented: Object.keys(rentalDateModifiers)
                  .filter(dateStr => rentalDateModifiers[dateStr].rented)
                  .map(dateStr => parseISO(dateStr)),
  };

  const modifiersStyles = {
    rented: {
      backgroundColor: 'hsl(var(--primary) / 0.3)',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '2px',
    }
  };
  
  const { dailyRentalCounts, conflicts, conflictDates } = useMemo(() => {
    const newDailyRentalCounts: Record<string, Record<string, number>> = {};
    rentals.forEach(rental => {
      let currentDateLoop = startOfDay(new Date(rental.startDate));
      const endDateLoop = endOfDay(new Date(rental.endDate));
      while (currentDateLoop <= endDateLoop) {
        const dateStr = format(currentDateLoop, 'yyyy-MM-dd');
        if (!newDailyRentalCounts[dateStr]) newDailyRentalCounts[dateStr] = {};
        if (!newDailyRentalCounts[dateStr][rental.equipmentId]) newDailyRentalCounts[dateStr][rental.equipmentId] = 0;
        newDailyRentalCounts[dateStr][rental.equipmentId] += rental.quantityRented;
        currentDateLoop = new Date(currentDateLoop.setDate(currentDateLoop.getDate() + 1));
      }
    });

    const newConflicts: { date: Date, equipmentId: string, count: number, equipmentName: string, available: number }[] = [];
    Object.entries(newDailyRentalCounts).forEach(([dateStr, equipmentCounts]) => {
      Object.entries(equipmentCounts).forEach(([equipmentId, count]) => {
        const eq = equipment.find(e => e.id === equipmentId);
        if (eq && count > eq.quantity) {
          newConflicts.push({ date: parseISO(dateStr), equipmentId, count, equipmentName: eq.name, available: eq.quantity });
        }
      });
    });
    const newConflictDates = newConflicts.map(c => c.date);
    return { dailyRentalCounts: newDailyRentalCounts, conflicts: newConflicts, conflictDates: newConflictDates };
  }, [rentals, equipment]);

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

  if (!isDataLoaded || selectedDate === undefined) {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading calendar data...</p>
            </div>
        </div>
    );
  }

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

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
              initialFocus
            />
          </CardContent>
        </Card>
        {conflicts.length > 0 && (
          <Card className="mt-6 shadow-lg bg-destructive/10 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" /> Potential Overbooking Conflicts
              </CardTitle>
              <CardDescription>Overview of all detected overbookings in the schedule.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40">
                <ul className="space-y-1 text-sm">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>
                      {format(conflict.date, "PPP")}: <strong>{conflict.equipmentName}</strong> overbooked (Rented: {conflict.count} / Available: {conflict.available})
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
              <ScrollArea className="h-80 lg:h-[calc(100vh-380px)]"> {/* Adjusted height for mobile/tablet and larger screens */}
                <ul className="space-y-3">
                  {rentalsForSelectedDate.map(rental => {
                    const equipmentItem = equipment.find(e => e.id === rental.equipmentId);
                    const totalAvailable = equipmentItem ? equipmentItem.quantity : 0;
                    const rentedOnSelectedDate = selectedDateStr && dailyRentalCounts[selectedDateStr] && dailyRentalCounts[selectedDateStr][rental.equipmentId]
                      ? dailyRentalCounts[selectedDateStr][rental.equipmentId]
                      : 0;
                    const isOverbookedOnSelectedDate = rentedOnSelectedDate > totalAvailable;

                    return (
                      <li 
                        key={rental.id} 
                        className={cn(
                          "p-3 border rounded-md bg-card-foreground/5 group hover:bg-card-foreground/10 transition-colors",
                          isOverbookedOnSelectedDate && "bg-destructive/10 border-destructive/30 ring-1 ring-destructive/50"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <div className="flex items-center">
                                <p className="font-semibold">{rental.equipmentName} <Badge variant="secondary" className="ml-1">Qty: {rental.quantityRented}</Badge></p>
                                {isOverbookedOnSelectedDate && (
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertTriangle className="h-4 w-4 text-destructive ml-2 flex-shrink-0 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Overbooked on this day! Rented: {rentedOnSelectedDate}, Available: {totalAvailable}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Client: {rental.clientName}</p>
                            <p className="text-xs text-muted-foreground">Event: {rental.eventLocation}</p>
                            <p className="text-xs text-muted-foreground">
                              Period: {format(new Date(rental.startDate), "PP")} - {format(new Date(rental.endDate), "PP")}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary flex-shrink-0 ml-2"
                            onClick={() => router.push(`/rentals/${rental.id}/edit`)}
                            aria-label={`Edit rental for ${rental.equipmentName}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">
                {selectedDate ? "No rentals scheduled for this date." : "Select a date to see rentals."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
