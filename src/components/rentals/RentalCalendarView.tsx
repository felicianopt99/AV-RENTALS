  

"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Rental, EquipmentItem, Event } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
import { useTranslate } from '@/contexts/TranslationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { createEvents } from 'ics';
import { CalendarExport } from './CalendarExport';

interface RentalCalendarViewProps {
  searchQuery: string;
  filters: { equipment?: string; client?: string; category?: string };
  calendarRef: React.RefObject<any>;
}

export function RentalCalendarView({ searchQuery, filters }: RentalCalendarViewProps) {
  // Translation hooks
  const { translated: toastEventRescheduledTitleText } = useTranslate('Event Rescheduled');

  const { rentals, equipment, events, isDataLoaded, clients, categories } = useAppContext();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number }>({ visible: false, content: '', x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileEventsList, setShowMobileEventsList] = useState(false);
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    // Set initial date to today
    setSelectedDate(new Date());
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let hammer: any = null;
    
    const setupSwipeGestures = async () => {
      if (calendarRef.current && typeof window !== 'undefined') {
        const { default: Hammer } = await import('hammerjs');
        const api = calendarRef.current.getApi();
        hammer = new Hammer(api.el);
        hammer.on('swipeleft', () => api.next());
        hammer.on('swiperight', () => api.prev());
      }
    };

    setupSwipeGestures();

    return () => {
      if (hammer) {
        hammer.destroy();
      }
    };
  }, [calendarRef.current]);



  const handleDateClick = (info: any) => {
    setSelectedDate(info.date);
    if (isMobile) {
      setShowMobileEventsList(true);
    }
  };

  const handleDatesSet = (info: any) => {
    setSelectedDate(info.start);
  };

  const handleEventMouseEnter = (info: any) => {
    const event = info.event;
    const extendedProps = event.extendedProps;
    const client = clients.find(c => c.id === extendedProps.event.clientId);
    const content = `
      <div>
        <strong>${event.title}</strong><br/>
        Client: ${client?.name || 'Unknown'}<br/>
        Dates: ${format(new Date(extendedProps.event.startDate), 'MMM dd')} - ${format(new Date(extendedProps.event.endDate), 'MMM dd')}<br/>
        Rentals: ${extendedProps.rentals.length} items
      </div>
    `;
    setTooltip({
      visible: true,
      content,
      x: info.jsEvent.pageX,
      y: info.jsEvent.pageY,
    });
  };

  const handleEventMouseLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  const handleEventDrop = (info: any) => {
    const event = info.event;
    const newStart = event.start;
    const newEnd = event.end;
    const eventId = event.id;
    const originalEvent = events.find(e => e.id === eventId);
    if (!originalEvent) return;
    const updatedEvent = { ...originalEvent, startDate: newStart.toISOString(), endDate: newEnd.toISOString() };
    dispatch.updateEvent(updatedEvent);
    toast({ title: toastEventRescheduledTitleText, description: `Event moved to ${format(newStart, 'PPP')} - ${format(newEnd, 'PPP')}` });
  };

  const handleExportCSV = () => {
    const data = eventsWithRentals.map(event => ({
      Name: event.name,
      Client: clients.find(c => c.id === event.clientId)?.name || 'Unknown',
      Start: event.startDate,
      End: event.endDate,
      Rentals: event.rentals.length,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Events List', 10, 10);
    let y = 20;
    eventsWithRentals.forEach(event => {
      doc.text(`${event.name} - ${event.startDate} to ${event.endDate}`, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('events.pdf');
  };

  const handleExportICS = () => {
    const eventsForICS = eventsWithRentals.map(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      return {
        title: event.name,
        start: [start.getFullYear(), start.getMonth() + 1, start.getDate()] as [number, number, number],
        end: [end.getFullYear(), end.getMonth() + 1, end.getDate()] as [number, number, number],
        description: `Client: ${clients.find(c => c.id === event.clientId)?.name || 'Unknown'}`,
      };
    });
    const { error, value } = createEvents(eventsForICS);
    if (error) {
      console.error(error);
      return;
    }
    if (value) {
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events.ics';
      a.click();
      URL.revokeObjectURL(url);
    }
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
    // Index rentals by eventId
    const rentalsByEvent = rentalsWithEventData.reduce((map, rental) => {
      if (!map.has(rental.eventId)) {
        map.set(rental.eventId, [] as typeof rentalsWithEventData);
      }
      map.get(rental.eventId)!.push(rental);
      return map;
    }, new Map<string, typeof rentalsWithEventData>());

    // Start from all events to ensure events without rentals are included
    return events.map(e => ({
      ...e,
      rentals: rentalsByEvent.get(e.id) || [],
    }));
  }, [events, rentalsWithEventData]);

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
        <div className="flex flex-col">
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading calendar data...</p>
            </div>
        </div>
    );
  }

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  return (
    <>
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-background shadow-lg border rounded-md p-3 max-w-xs text-sm pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
      <div className={`grid gap-4 md:gap-6 h-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
        <div className={isMobile ? 'col-span-1' : 'lg:col-span-3'}>
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-col space-y-3 p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">Equipment Rental Calendar</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {isMobile ? 'Tap events for details. Swipe to navigate.' : 'Click on an event to view details. Select a date to see active rentals. Dates with rentals are highlighted. Dates with conflicts are marked in red.'}
                  </CardDescription>
                </div>
                {!isMobile && (
                  <div className="flex-shrink-0">
                    <CalendarExport onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportICS={handleExportICS} />
                  </div>
                )}
              </div>
              {isMobile && (
                <div className="flex justify-center">
                  <CalendarExport onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportICS={handleExportICS} />
                </div>
              )}
            </CardHeader>
            <CardContent className={`p-1 sm:p-4 ${isMobile ? 'h-[400px]' : 'h-[500px] sm:h-[600px] lg:h-[700px]'}`}>
              <style jsx>{`
                .fc .fc-button {
                  background-color: hsl(var(--primary));
                  border-color: hsl(var(--primary));
                  color: hsl(var(--primary-foreground));
                }
                .fc .fc-button:hover {
                  background-color: hsl(var(--primary) / 0.8);
                }
                .fc .fc-today-button {
                  background-color: hsl(var(--muted));
                }
                .fc .fc-header-toolbar {
                  margin-bottom: 1rem;
                  padding: 0.5rem;
                }
                .fc-event {
                  border-radius: 4px;
                  font-size: 0.875rem;
                }
                .fc .fc-daygrid-day-frame {
                  min-height: 80px;
                }
                
                @media (max-width: 768px) {
                  .fc .fc-header-toolbar {
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    padding: 0.25rem;
                  }
                  .fc .fc-toolbar-chunk {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.25rem;
                  }
                  .fc .fc-button {
                    padding: 6px 10px;
                    font-size: 12px;
                    min-width: 60px;
                  }
                  .fc .fc-toolbar-title {
                    font-size: 1.1rem;
                    margin: 0;
                    text-align: center;
                  }
                  .fc-event {
                    min-height: 32px;
                    font-size: 11px;
                    padding: 2px 4px;
                    line-height: 1.2;
                  }
                  .fc .fc-daygrid-day-frame {
                    min-height: 60px;
                  }
                  .fc .fc-daygrid-day-number {
                    font-size: 0.875rem;
                    padding: 4px;
                  }
                  .fc .fc-col-header-cell {
                    padding: 8px 4px;
                  }
                  .fc .fc-daygrid-event {
                    margin: 1px 2px;
                  }
                  .fc .fc-more-link {
                    font-size: 11px;
                    padding: 1px 4px;
                  }
                }
                
                @media (max-width: 480px) {
                  .fc .fc-button {
                    padding: 4px 8px;
                    font-size: 11px;
                    min-width: 50px;
                  }
                  .fc .fc-toolbar-title {
                    font-size: 1rem;
                  }
                  .fc .fc-daygrid-day-frame {
                    min-height: 50px;
                  }
                  .fc-event {
                    font-size: 10px;
                    min-height: 28px;
                  }
                }
              `}</style>
              <div className="h-full relative">
                {/* Mobile floating button to show events */}
                {isMobile && selectedDate && eventsForSelectedDate.length > 0 && (
                  <Button
                    onClick={() => setShowMobileEventsList(true)}
                    className="absolute top-2 right-2 z-10 h-8 px-3 text-xs shadow-lg"
                    size="sm"
                  >
                    {eventsForSelectedDate.length} event{eventsForSelectedDate.length !== 1 ? 's' : ''}
                  </Button>
                )}
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
                  initialView="dayGridMonth"
                  initialDate={new Date()}
                  events={calendarEvents}
                  dateClick={handleDateClick}
                  datesSet={handleDatesSet}
                  dayCellClassNames={dayCellClassNames}
                  eventMouseEnter={isMobile ? undefined : handleEventMouseEnter}
                  eventMouseLeave={isMobile ? undefined : handleEventMouseLeave}
                  eventDrop={isMobile ? undefined : handleEventDrop}
                  headerToolbar={isMobile ? {
                    left: 'prev',
                    center: 'title',
                    right: 'next'
                  } : {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  footerToolbar={isMobile ? {
                    left: 'today',
                    center: '',
                    right: 'dayGridMonth'
                  } : undefined}
                  height={isMobile ? 'auto' : '100%'}
                  aspectRatio={isMobile ? 1 : 1.35}
                  eventDisplay="block"
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  allDaySlot={false}
                  editable={!isMobile}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={isMobile ? 2 : 3}
                  weekends={true}
                  nowIndicator={true}
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                  dayHeaderFormat={isMobile ? { weekday: 'narrow' } : { weekday: 'short' }}
                  titleFormat={isMobile ? {
                    month: 'short',
                    year: '2-digit'
                  } : {
                    month: 'long',
                    year: 'numeric'
                  }}
                  buttonText={{
                    today: 'Today',
                    month: isMobile ? 'Month' : 'Month',
                    week: 'Week',
                    day: 'Day'
                  }}
                  views={isMobile ? {
                    dayGridMonth: { 
                      dayHeaderFormat: { weekday: 'narrow' },
                      dayMaxEvents: 2,
                      moreLinkClick: 'popover',
                      fixedWeekCount: false
                    }
                  } : {
                    dayGridMonth: {
                      dayMaxEvents: 3
                    },
                    timeGridWeek: { 
                      dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' } 
                    },
                    multiMonthYear: { 
                      titleFormat: { year: 'numeric' } 
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
          {conflicts.length > 0 && (
            <Card className="mt-4 md:mt-6 shadow-lg bg-destructive/10 border-destructive/30">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-destructive flex items-center text-sm md:text-base">
                  <AlertTriangle className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" /> 
                  Potential Overbooking Conflicts
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Overview of all detected overbookings in the schedule.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <ScrollArea className={`${isMobile ? 'h-32' : 'h-40'}`}>
                  <ul className="space-y-2 text-xs md:text-sm">
                    {conflicts.map((conflict, index) => (
                      <li key={index} className="p-2 bg-background/50 rounded border-l-2 border-destructive">
                        <div className="flex flex-col space-y-1">
                          <span className="font-medium">
                            {format(conflict.date, isMobile ? "MMM dd" : "PPP")}
                          </span>
                          <span>
                            <strong>{conflict.equipmentName}</strong> overbooked
                          </span>
                          <span className="text-muted-foreground">
                            Rented: {conflict.count} / Available: {conflict.available}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {!isMobile && (
          <div className={`${isCollapsed ? 'lg:col-span-0 hidden lg:block' : 'lg:col-span-1'}`}>
            <Card className="shadow-lg h-full">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-sm lg:text-base">
                  Events for {selectedDate ? format(selectedDate, "MMM dd") : 'No Date Selected'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="p-4">
                  {eventsForSelectedDate.length > 0 ? (
                    <ScrollArea className="h-80 lg:h-96 xl:h-[min(500px,calc(100vh-400px))]">
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
                              <div className="flex flex-col gap-2">
                                <div className="flex-grow">
                                  <p className="font-semibold text-sm">{event.name}</p>
                                  <p className="text-xs text-muted-foreground">Client: {clientName}</p>
                                  <p className="text-xs text-muted-foreground">Items: {totalRentals}, Qty: {totalQuantity}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd')}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedEvent(event)}
                                  className="self-start"
                                >
                                  View Details
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {selectedDate ? "No events scheduled for this date." : "Select a date to see events."}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Events List Dialog */}
      {isMobile && showMobileEventsList && (
        <Dialog open={showMobileEventsList} onOpenChange={setShowMobileEventsList}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Events for {selectedDate ? format(selectedDate, "PPP") : 'Selected Date'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {eventsForSelectedDate.length > 0 ? (
                <ScrollArea className="h-60">
                  <ul className="space-y-3">
                    {eventsForSelectedDate.map(event => {
                      const client = clients.find(c => c.id === event.clientId);
                      const clientName = client?.name || 'Unknown Client';
                      const totalRentals = event.rentals.length;
                      const totalQuantity = event.rentals.reduce((sum: number, r: any) => sum + r.quantityRented, 0);

                      return (
                        <li
                          key={event.id}
                          className="p-3 border rounded-md bg-card-foreground/5 transition-colors"
                        >
                          <div className="space-y-2">
                            <div>
                              <p className="font-semibold text-sm">{event.name}</p>
                              <p className="text-xs text-muted-foreground">Client: {clientName}</p>
                              <p className="text-xs text-muted-foreground">Items: {totalRentals}, Qty: {totalQuantity}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd')}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowMobileEventsList(false);
                              }}
                              className="w-full"
                            >
                              View Details
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No events scheduled for this date.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

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