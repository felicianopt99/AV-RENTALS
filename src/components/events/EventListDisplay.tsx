
"use client";

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Event, Client } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { useTranslate } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, MoreHorizontal, Search, SearchSlash, PartyPopper, ListChecks, Calendar, Clock, MapPin, User, Filter, Grid3X3, List, SortAsc, SortDesc } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format, isAfter, isBefore, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from 'date-fns';
import { EventFormDialog } from './EventFormDialog';
import { cn } from '@/lib/utils';

type ViewMode = 'table' | 'cards';
type SortField = 'name' | 'startDate' | 'client' | 'location';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'upcoming' | 'ongoing' | 'completed';

export function EventListDisplay() {
  const { events, clients, isDataLoaded } = useAppContext();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Translation hooks
  const { translated: eventsText } = useTranslate('Events');
  const { translated: createNewEventText } = useTranslate('Create New Event');
  const { translated: allText } = useTranslate('All');
  const { translated: upcomingText } = useTranslate('Upcoming');
  const { translated: ongoingText } = useTranslate('Ongoing');
  const { translated: completedText } = useTranslate('Completed');
  const { translated: searchEventsText } = useTranslate('Search events (name, client, location)...');
  const { translated: allClientsText } = useTranslate('All Clients');
  const { translated: sortByText } = useTranslate('Sort by');
  const { translated: nameText } = useTranslate('Name');
  const { translated: dateText } = useTranslate('Date');
  const { translated: clientText } = useTranslate('Client');
  const { translated: locationText } = useTranslate('Location');
  const { translated: loadingEventDataText } = useTranslate('Loading event data...');
  const { translated: todayText } = useTranslate('Today');
  const { translated: tomorrowText } = useTranslate('Tomorrow');
  const { translated: yesterdayText } = useTranslate('Yesterday');
  const { translated: viewDetailsText } = useTranslate('View Details');
  const { translated: editText } = useTranslate('Edit');
  const { translated: noEventsFoundText } = useTranslate('No events found');
  const { translated: startAddingText } = useTranslate('Start by creating your first event');
  const { translated: noEventsMatchFiltersText } = useTranslate('No events match your filters.');
  const { translated: noEventsYetText } = useTranslate('No events yet.');
  const { translated: tryAdjustingFiltersText } = useTranslate('Try adjusting your filters or search terms.');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  const getEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (isBefore(now, startOfDay(start))) return 'upcoming';
    if (isAfter(now, endOfDay(end))) return 'completed';
    return 'ongoing';
  };

  const eventsWithClient = useMemo(() => {
    return events.map(event => ({
      ...event,
      client: clients.find(c => c.id === event.clientId),
      status: getEventStatus(event)
    }));
  }, [events, clients]);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = eventsWithClient.filter(event => {
      const matchesSearch = searchTerm === '' || 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.client && event.client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
      const matchesClient = selectedClient === 'all' || event.clientId === selectedClient;
      
      return matchesSearch && matchesStatus && matchesClient;
    });

    // Sort events
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'startDate':
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case 'client':
          aValue = (a.client?.name || '').toLowerCase();
          bValue = (b.client?.name || '').toLowerCase();
          break;
        case 'location':
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
          break;
        default:
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [eventsWithClient, searchTerm, filterStatus, selectedClient, sortField, sortOrder]);

  const handleFormSubmitSuccess = (newEventId?: string) => {
    setIsFormOpen(false);
    if(newEventId) {
      router.push(`/events/${newEventId}`);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{upcomingText}</Badge>;
      case 'ongoing':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{ongoingText}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{completedText}</Badge>;
    }
  };

  const getDateDescription = (date: Date) => {
    if (isToday(date)) return todayText;
    if (isTomorrow(date)) return tomorrowText;
    if (isYesterday(date)) return yesterdayText;
    return format(date, 'MMM dd, yyyy');
  };

  if (!isDataLoaded) {
    return (
        <div className="flex flex-col">
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">{loadingEventDataText}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">{eventsText}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredAndSortedEvents.length} of {events.length} events
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> {createNewEventText}
        </Button>
      </div>

      {/* Quick Status Tabs */}
      <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            {allText} ({eventsWithClient.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
            {upcomingText} ({eventsWithClient.filter(e => e.status === 'upcoming').length})
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="text-xs sm:text-sm">
            {ongoingText} ({eventsWithClient.filter(e => e.status === 'ongoing').length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            {completedText} ({eventsWithClient.filter(e => e.status === 'completed').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters and Controls */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={searchEventsText}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Additional Filters and View Controls */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Client Filter */}
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder={allClientsText} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{allClientsText}</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
                      <span className="hidden sm:inline">Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSort('startDate')}>
                      {dateText} {sortField === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('name')}>
                      {nameText} {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('client')}>
                      {clientText} {sortField === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('location')}>
                      {locationText} {sortField === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-md p-1 self-start sm:self-auto">
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 flex-1 sm:flex-initial"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="ml-1 sm:hidden">Cards</span>
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 flex-1 sm:flex-initial"
                >
                  <List className="h-4 w-4" />
                  <span className="ml-1 sm:hidden">Table</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      {filteredAndSortedEvents.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12 text-muted-foreground flex flex-col items-center">
            {searchTerm || filterStatus !== 'all' || selectedClient !== 'all' ? (
              <>
                <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
                <p className="text-xl mb-1">{noEventsMatchFiltersText}</p>
                <p className="text-sm">{tryAdjustingFiltersText}</p>
              </>
            ) : (
              <>
                <PartyPopper className="w-16 h-16 mb-4 text-primary/50" />
                <p className="text-xl mb-1">{noEventsYetText}</p>
                <p className="text-sm">{startAddingText}</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredAndSortedEvents.map((event) => (
            <Card 
              key={event.id} 
              className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border-0 hover:bg-muted/30"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <CardHeader className="pb-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate transition-colors">
                      {event.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="accentGhost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`)}}>
                        <Edit className="mr-2 h-4 w-4" />
                        {viewDetailsText}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/rentals/${event.id}/prep`)}}>
                        <ListChecks className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400">Prepare Event</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{event.client?.name || 'No client assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{event.location || 'No location specified'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs">{getDateDescription(new Date(event.startDate))}</div>
                      <div className="text-xs">to {getDateDescription(new Date(event.endDate))}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`)}}
                    className="flex-1 text-xs"
                  >
                    <Edit className="mr-1 h-3 w-3" /> View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); router.push(`/rentals/${event.id}/prep`)}}
                    className="flex-1 text-xs bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                  >
                    <ListChecks className="mr-1 h-3 w-3 text-blue-500 dark:text-blue-400" /> Prepare
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      Event Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('client')}>
                      Client {sortField === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('location')}>
                      Location {sortField === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('startDate')}>
                      Dates {sortField === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEvents.map((event) => (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/events/${event.id}`)}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.client?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{event.location}</TableCell>
                      <TableCell className="text-sm">
                        <div>{getDateDescription(new Date(event.startDate))}</div>
                        <div className="text-muted-foreground">to {getDateDescription(new Date(event.endDate))}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`)}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); router.push(`/rentals/${event.id}/prep`)}}
                            className="bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                          >
                            <ListChecks className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <EventFormDialog 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmitSuccess={handleFormSubmitSuccess}
      />
    </div>
  );
}

    