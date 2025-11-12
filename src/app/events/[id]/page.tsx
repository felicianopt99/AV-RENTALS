
// src/app/events/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Event, Rental, EquipmentItem, Client } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, PackageSearch, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { AddEquipmentToEventDialog } from '@/components/events/AddEquipmentToEventDialog';
import { useTranslate } from '@/contexts/TranslationContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EventDetailsPage() {
  // Translation hooks
  const { translated: toastEventDeletedTitleText } = useTranslate('Event Deleted');
  const { translated: toastTheequipmenthasbeenrDescText } = useTranslate('The equipment has been removed from this event.');
  const { translated: toastEquipmentRemovedTitleText } = useTranslate('Equipment Removed');
  const { translated: toastEventnotfoundDescText } = useTranslate('Event not found.');
  const { translated: toastErrorTitleText } = useTranslate('Error');

  const params = useParams();
  const router = useRouter();
  const { events, clients, rentals, equipment, isDataLoaded } = useAppContext();
  const { deleteRental, deleteEvent } = useAppDispatch();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [event, setEvent] = useState<Event | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [eventRentals, setEventRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<(Rental & { equipment?: EquipmentItem }) | null>(null);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);

  const eventId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        const foundClient = clients.find(c => c.id === foundEvent.clientId);
        setClient(foundClient || null);

        const rentalsForEvent = rentals
          .filter(r => r.eventId === eventId)
          .map(r => ({
            ...r,
            equipment: equipment.find(eq => eq.id === r.equipmentId)
          }));
        setEventRentals(rentalsForEvent);
      } else {
        toast({ variant: "destructive", title: toastErrorTitleText, description: toastEventnotfoundDescText});
        router.replace('/events'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !eventId) {
        router.replace('/events');
        setLoading(false);
    }
  }, [eventId, events, clients, rentals, equipment, isDataLoaded, router, toast]);
  
  const handleEditFormSubmitSuccess = () => {
    setIsEditFormOpen(false);
    // Data will refresh via useEffect
  }
  
  const handleAddEquipmentSuccess = () => {
    setIsAddEquipmentOpen(false);
    // Data will refresh via useEffect
  }

  const handleDeleteRental = () => {
    if(rentalToDelete) {
        deleteRental(rentalToDelete.id);
        toast({ title: toastEquipmentRemovedTitleText, description: toastTheequipmenthasbeenrDescText});
        setRentalToDelete(null);
    }
  }

  const handleDeleteEvent = () => {
    if(event) {
        deleteEvent(event.id);
        toast({ title: toastEventDeletedTitleText, description: `The event "${event.name}" and all its rentals have been deleted.`});
        router.push('/events');
    }
    setIsDeleteEventOpen(false);
  }

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading event data...</p>
            </div>
        </div>
    );
  }

  if (!event) {
    return (
        <div className="flex flex-col min-h-screen">
            
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">Event not found or could not be loaded.</p>
            </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col h-full">
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Card className="max-w-4xl mx-auto shadow-xl">
              <CardHeader>
                <div className='flex justify-between items-start gap-4'>
                    <div>
                        <CardTitle className="text-3xl">{event.name}</CardTitle>
                        <CardDescription className="mt-2 text-base">
                            For: <Link
                            href={`/clients/${client?.id}/edit`}
                            className="text-primary hover:underline">{client?.name || 'Unknown Client'}</Link>
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      <Button variant="outline" onClick={() => router.push(`/rentals/${event.id}/prep`)}><ListChecks className="mr-2 h-4 w-4" /> Prepare Event</Button>
                      <Button variant="outline" onClick={() => setIsEditFormOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Event</Button>
                    </div>
                </div>
                <div className="text-sm text-muted-foreground pt-4 flex flex-wrap gap-x-6 gap-y-2">
                    <span><strong>Location:</strong> {event.location}</span>
                    <span><strong>From:</strong> {format(new Date(event.startDate), "PPP")}</span>
                    <span><strong>To:</strong> {format(new Date(event.endDate), "PPP")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">Rented Equipment</h3>
                <div className="border rounded-md">
                     {eventRentals.length > 0 ? (
                       <>
                         {/* Mobile Card View */}
                         {isMobile ? (
                           <div className="space-y-2 p-3">
                             {eventRentals.map((rental, index) => (
                               <div key={`${rental.id}-${index}`} className="p-3 rounded-2xl bg-background/50 hover:bg-muted/30 transition-colors border-0">
                                 <div className="flex items-center justify-between">
                                   <div className="flex-1 min-w-0">
                                     <h4 className="font-medium text-sm truncate">{rental.equipment?.name || 'N/A'}</h4>
                                     <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                       <span>Qty: {rental.quantityRented}</span>
                                       <span>•</span>
                                       <div className={`w-2 h-2 rounded-full ${rental.equipment?.status === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                       <span>{rental.equipment?.status || 'Unknown'}</span>
                                     </div>
                                   </div>
                                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRentalToDelete(rental)}>
                                     <Trash2 className="h-3 w-3 text-destructive" />
                                   </Button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           /* Desktop Table View */
                           <Table>
                             <TableHeader>
                               <TableRow>
                                 <TableHead>Equipment</TableHead>
                                 <TableHead>Quantity</TableHead>
                                 <TableHead>Status</TableHead>
                                 <TableHead className="text-right">Actions</TableHead>
                               </TableRow>
                             </TableHeader>
                             <TableBody>
                               {eventRentals.map((rental, index) => (
                                 <TableRow key={`${rental.id}-${index}`}>
                                   <TableCell className="font-medium">{rental.equipment?.name || 'N/A'}</TableCell>
                                   <TableCell>{rental.quantityRented}</TableCell>
                                   <TableCell>
                                     <Badge variant={rental.equipment?.status === 'good' ? 'secondary' : 'destructive'}>
                                       {rental.equipment?.status || 'Unknown'}
                                     </Badge>
                                   </TableCell>
                                   <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => setRentalToDelete(rental)}>
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                   </TableCell>
                                 </TableRow>
                               ))}
                             </TableBody>
                           </Table>
                         )}
                       </>
                     ) : (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                            <PackageSearch className="w-16 h-16 mb-4 text-primary/50" />
                            <p className="text-lg mb-1">No equipment rented for this event yet.</p>
                            <p className="text-sm">Click "Add Equipment" to get started.</p>
                        </div>
                    )}
                </div>
                 <Button className="mt-6" onClick={() => setIsAddEquipmentOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Equipment
                </Button>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button variant="destructive" onClick={() => setIsDeleteEventOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                </Button>
              </CardFooter>
            </Card>
          </div>
          {/* Dialogs */}
          <EventFormDialog 
            isOpen={isEditFormOpen}
            onOpenChange={setIsEditFormOpen}
            initialData={event}
            onSubmitSuccess={handleEditFormSubmitSuccess}
          />
          <AddEquipmentToEventDialog
            isOpen={isAddEquipmentOpen}
            onOpenChange={setIsAddEquipmentOpen}
            onSubmitSuccess={handleAddEquipmentSuccess}
            event={event}
          />
          {rentalToDelete && (
             <AlertDialog open={!!rentalToDelete} onOpenChange={() => setRentalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove "{rentalToDelete.equipment?.name}" from this event?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRentalToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRental} className="bg-destructive hover:bg-destructive/90">
                        Remove
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
          {isDeleteEventOpen && (
             <AlertDialog open={isDeleteEventOpen} onOpenChange={setIsDeleteEventOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Event Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the event "{event.name}"? This will also delete all rental records associated with it. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">
                        Delete Event
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
      </div>
  );
}
