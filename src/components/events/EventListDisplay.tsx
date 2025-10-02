
"use client";

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Event, Client } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
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
import { PlusCircle, Edit, MoreHorizontal, Search, SearchSlash, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { EventFormDialog } from './EventFormDialog';

export function EventListDisplay() {
  const { events, clients, isDataLoaded } = useAppContext();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const eventsWithClient = useMemo(() => {
    return events.map(event => ({
      ...event,
      client: clients.find(c => c.id === event.clientId)
    })).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [events, clients]);

  const filteredEvents = useMemo(() => eventsWithClient.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.client && event.client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  ), [eventsWithClient, searchTerm]);

  const handleFormSubmitSuccess = (newEventId?: string) => {
    setIsFormOpen(false);
    if(newEventId) {
      router.push(`/events/${newEventId}`);
    }
  }

  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-[calc(100vh-150px)]">
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading event data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Events</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Event
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Event List</CardTitle>
          <CardDescription>View, search, and manage all your events.</CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events (name, client, location)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm md:max-w-md pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              {searchTerm ? (
                <>
                  <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">No events match your search.</p>
                  <p className="text-sm">Try a different search term or clear the search.</p>
                </>
              ) : (
                <>
                  <PartyPopper className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">No events yet.</p>
                  <p className="text-sm">Click "Create New Event" to get started.</p>
                </>
              )}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.client?.name || 'N/A'}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>{format(new Date(event.startDate), 'PP')}</TableCell>
                    <TableCell>{format(new Date(event.endDate), 'PP')}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`)}}>
                            <Edit className="mr-2 h-4 w-4" /> View / Manage
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <EventFormDialog 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmitSuccess={handleFormSubmitSuccess}
      />
    </div>
  );
}
