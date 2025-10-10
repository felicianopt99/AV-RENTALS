 

"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Rental, EquipmentItem, Event } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Edit3, ListChecks, PlusCircle, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RentalCalendarViewProps {
  searchQuery: string;
  filters: { equipment?: string; client?: string; category?: string };
  calendarRef: React.RefObject<any>;
}

export function RentalCalendarView({ searchQuery, filters }: RentalCalendarViewProps) {
  const { rentals, equipment, events, isDataLoaded, clients, categories } = useAppContext();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    // Set initial date to today
    setSelectedDate(new Date());
  }, []);



  const handleDateClick = (info: any) => {
    setSelectedDate(info.date);
  };

  const handleDatesSet = (info: any) => {
    setSelectedDate(info.start);
  };

  const dayCellClassNames = (arg: any) => {
    const dateStr = format(arg.date, 'yyyy-MM-dd');
    const isRented = rentalDateModifiers[dateStr]?.rented;
    const isConflict = conflictDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    
    const classes = [];
    if (isRented) {
      classes.push('bg-primary/20', 'border-primary/30');
    }
    if (isConflict) {
      classes.push('bg-destructive/20', 'border-destructive/30');
    }
    return classes;
  };
  
  const rentalsWithEventData = useMemo(() => {
    return rentals.map(rental => {
        const event = events.find(e => e.id === rental.eventId);
        return {
            ...rental,
            event: event,
        };
    }).filter(r => r.event); // Filter out rentals with no associated event
  }, [rentals, events]);

  const eventsWithRentals = useMemo(() => {
    const eventMap = new Map();
    rentalsWithEventData.forEach(rental => {
      if (!eventMap.has(rental.eventId)) {
        eventMap.set(rental.eventId, {
          ...rental.event,
          rentals: [],
        });
      }
      eventMap.get(rental.eventId).rentals.push(rental);
    });
    return Array.from(eventMap.values());
  }, [rentalsWithEventData]);

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    let filtered = eventsWithRentals.filter(event =>
        isWithinInterval(selectedDate, { start: startOfDay(new Date(event.startDate)), end: endOfDay(new Date(event.endDate)) })
      );

    // Apply filters (client only, since events)
    if (filters.client) {
      filtered = filtered.filter(e => e.clientId === filters.client);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const client = clients.find(c => c.id === e.clientId);
        return (
          e.name.toLowerCase().includes(query) ||
          client?.name.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [selectedDate, eventsWithRentals, filters, searchQuery, clients]);

  const rentalDateModifiers = useMemo(() => {
    return rentalsWithEventData.reduce((acc, rental) => {
      if(!rental.event) return acc;
      const start = startOfDay(new Date(rental.event.startDate));
      const end = endOfDay(new Date(rental.event.endDate));
      
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
  }, [rentalsWithEventData]);

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
    rentalsWithEventData.forEach(rental => {
      if(!rental.event) return;
      let currentDateLoop = startOfDay(new Date(rental.event.startDate));
      const endDateLoop = endOfDay(new Date(rental.event.endDate));
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
  }, [rentalsWithEventData, equipment]);

  const calendarEvents = useMemo(() => {
    return eventsWithRentals.map(event => {
      const totalRentals = event.rentals.length;
      const totalQuantity = event.rentals.reduce((sum: number, r: any) => sum + r.quantityRented, 0);
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Check for conflicts in the event period
      let hasConflict = false;
      let currentDateLoop = new Date(eventStart);
      while (currentDateLoop <= eventEnd) {
        const dateStr = format(currentDateLoop, 'yyyy-MM-dd');
        event.rentals.forEach((rental: any) => {
          const equipmentItem = equipment.find(e => e.id === rental.equipmentId);
          if (dailyRentalCounts[dateStr] && dailyRentalCounts[dateStr][rental.equipmentId] > (equipmentItem?.quantity || 0)) {
            hasConflict = true;
          }
        });
        currentDateLoop = new Date(currentDateLoop.setDate(currentDateLoop.getDate() + 1));
      }
      
      return {
        id: event.id,
        title: `${event.name} (${totalRentals} rentals, Qty: ${totalQuantity})`,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: hasConflict ? 'hsl(var(--destructive) / 0.6)' : 'hsl(var(--primary) / 0.4)',
        borderColor: hasConflict ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
        textColor: 'hsl(var(--primary-foreground))',
        classNames: hasConflict ? ['fc-event-conflict'] : ['fc-event-rented'],
        extendedProps: {
          event,
          rentals: event.rentals,
        },
      };
    });
  }, [eventsWithRentals, equipment, dailyRentalCounts]);

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
    <>
      <div className="grid md:grid-cols-4 gap-6 h-full">
        <div className="md:col-span-3">
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle>Equipment Rental Calendar</CardTitle>
              <CardDescription>Click on an event to view details. Select a date to see active rentals. Dates with rentals are highlighted. Dates with conflicts are marked in red.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[600px]">
              <div className="h-full">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
                  initialView="dayGridMonth"
                  initialDate={new Date()}
                  events={calendarEvents}
                  dateClick={handleDateClick}
                  datesSet={handleDatesSet}
                  dayCellClassNames={dayCellClassNames}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear'
                  }}
                  height="100%"
                  eventDisplay="block"
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  allDaySlot={false}
                  editable={false}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  nowIndicator={true}
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                  dayHeaderFormat={{ weekday: 'short' }}
                  titleFormat={{
                    month: 'long',
                    year: 'numeric'
                  }}
                  buttonText={{
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day',
                    year: 'Year'
                  }}
                  views={{
                    timeGridWeek: { dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' } },
                    multiMonthYear: { titleFormat: { year: 'numeric' } }
                  }}
                />
              </div>
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

        <div className={`${isCollapsed ? 'md:col-span-0 hidden md:block' : 'md:col-span-1'}`}>
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                Events for {selectedDate ? format(selectedDate, "PPP") : 'No Date Selected'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </CardHeader>
            {!isCollapsed && (
              <CardContent>
                {eventsForSelectedDate.length > 0 ? (
                  <ScrollArea className="h-80 lg:h-[calc(100vh-380px)]">
                    <ul className="space-y-3">
                      {eventsForSelectedDate.map(event => {
                        const client = clients.find(c => c.id === event.clientId);
                        const clientName = client?.name || 'Unknown Client';
                        const totalRentals = event.rentals.length;
                        const totalQuantity = event.rentals.reduce((sum: number, r: any) => sum + r.quantityRented, 0);

                        return (
                          <li
                            key={event.id}
                            className="p-3 border rounded-md bg-card-foreground/5 group transition-colors hover:bg-muted"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-grow">
                                <p className="font-semibold">{event.name}</p>
                                <p className="text-xs text-muted-foreground">Client: {clientName}</p>
                                <p className="text-xs text-muted-foreground">Rentals: {totalRentals} items, Qty: {totalQuantity}</p>
                                <p className="text-xs text-muted-foreground">Dates: {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd')}</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                                View Details
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground">
                    {selectedDate ? "No events scheduled for this date." : "Select a date to see events."}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {selectedEvent && (
        <Dialog open={true} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent.name}</DialogTitle>
              <DialogDescription>
                Event from {format(new Date(selectedEvent.startDate), 'PPP')} to {format(new Date(selectedEvent.endDate), 'PPP')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Event Details</h3>
                  <p><strong>Client:</strong> {clients.find(c => c.id === selectedEvent.clientId)?.name || 'Unknown'}</p>
                  <p><strong>Location:</strong> {selectedEvent.location || 'Not specified'}</p>
                  <p><strong>Description:</strong> {selectedEvent.description || 'No description'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Rentals ({selectedEvent.rentals.length})</h3>
                  <ul className="space-y-2">
                    {selectedEvent.rentals.map((rental: any) => {
                      const equipmentItem = equipment.find(e => e.id === rental.equipmentId);
                      return (
                        <li key={rental.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>{equipmentItem?.name} (Qty: {rental.quantityRented})</span>
                          <div className="space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/rentals/${rental.id}`)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => dispatch.deleteRental(rental.id)}>
                              Delete
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => router.push(`/events/${selectedEvent.id}`)}>
                  Edit Event
                </Button>
                <Button onClick={() => router.push(`/rentals/${selectedEvent.id}/prep`)}>
                  Prepare Event
                </Button>
                <Button variant="destructive" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    