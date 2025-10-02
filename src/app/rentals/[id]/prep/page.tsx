

// src/app/rentals/[id]/prep/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Rental, EquipmentItem, Event } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, LogIn, LogOut, Camera, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type PrepItem = {
  equipmentId: string;
  name: string;
  quantity: number;
  status: 'scanned' | 'not-scanned';
};

export default function RentalPrepPage() {
  const params = useParams();
  const router = useRouter();
  // The `id` from the URL is now an EVENT ID, not a rental ID.
  const eventId = typeof params.id === 'string' ? params.id : undefined;
  
  const { events, rentals, equipment, isDataLoaded, clients } = useAppContext();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const [prepList, setPrepList] = useState<PrepItem[]>([]);
  const [checkInList, setCheckInList] = useState<PrepItem[]>([]);
  
  const client = useMemo(() => {
    if (!event) return null;
    return clients.find(c => c.id === event.clientId);
  }, [event, clients]);

  useEffect(() => {
    if (isDataLoaded && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Get all rentals for this event
        const eventRentals = rentals.filter(r => r.eventId === eventId);
        
        // Aggregate quantities by equipmentId
        const aggregatedItems: { [key: string]: { name: string, quantity: number, equipmentId: string } } = {};
        eventRentals.forEach(rental => {
            const equipmentItem = equipment.find(eq => eq.id === rental.equipmentId);
            const name = equipmentItem?.name || "Unknown Equipment";
            if(aggregatedItems[rental.equipmentId]) {
                aggregatedItems[rental.equipmentId].quantity += rental.quantityRented;
            } else {
                aggregatedItems[rental.equipmentId] = {
                    equipmentId: rental.equipmentId,
                    name: name,
                    quantity: rental.quantityRented,
                };
            }
        });
        
        // Create the list of items to prep based on aggregated data
        const itemsToPrep: PrepItem[] = Object.values(aggregatedItems).map(item => ({
            ...item,
            status: 'not-scanned'
        }));

        setPrepList(itemsToPrep);
        setCheckInList(itemsToPrep.map(i => ({...i, status: 'not-scanned'})));

      } else {
        router.replace('/events'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !eventId) {
        router.replace('/events');
        setLoading(false);
    }
  }, [eventId, events, rentals, equipment, isDataLoaded, router]);

  const { checkedOutCount, totalToCheckout } = useMemo(() => ({
    checkedOutCount: prepList.filter(i => i.status === 'scanned').reduce((sum, i) => sum + i.quantity, 0),
    totalToCheckout: prepList.reduce((sum, i) => sum + i.quantity, 0)
  }), [prepList]);

  const { checkedInCount, totalToCheckIn } = useMemo(() => ({
    checkedInCount: checkInList.filter(i => i.status === 'scanned').reduce((sum, i) => sum + i.quantity, 0),
    totalToCheckIn: checkInList.reduce((sum, i) => sum + i.quantity, 0)
  }), [checkInList]);

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Prepare Event" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading event data...</p>
            </div>
        </div>
    );
  }

  if (!event) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Prepare Event" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">Event not found.</p>
            </div>
        </div>
    );
  }
  
  const getStatusIcon = (status: 'scanned' | 'not-scanned') => {
    switch(status) {
      case 'scanned': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'not-scanned': return <Circle className="h-5 w-5 text-muted-foreground" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <AppHeader title={`Prepare: ${event.name}`} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle>{client?.name || "Unknown Client"}</CardTitle>
            <CardDescription>
              {event.location} | {format(new Date(event.startDate), "PPP")} to {format(new Date(event.endDate), "PPP")}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="checkout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkout"><LogOut className="mr-2 h-4 w-4" />Check-Out</TabsTrigger>
            <TabsTrigger value="checkin"><LogIn className="mr-2 h-4 w-4" />Check-In</TabsTrigger>
          </TabsList>

          {/* CHECK-OUT TAB */}
          <TabsContent value="checkout">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Check-Out</CardTitle>
                <CardDescription>Scan each item before it leaves for the event.</CardDescription>
                <div className="pt-2">
                  <p className="text-sm font-medium">
                    Progress: {checkedOutCount} / {totalToCheckout} items packed
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full md:w-auto" disabled>
                  <Camera className="mr-2 h-4 w-4" /> Start Scanning (Coming Soon)
                </Button>
                <Separator />
                <ul className="space-y-2">
                  {prepList.map((item, index) => (
                    <li key={`${item.equipmentId}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center">
                        {getStatusIcon(item.status)}
                        <span className="ml-3 font-medium">{item.name}</span>
                        <Badge variant="secondary" className="ml-2">Qty: {item.quantity}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHECK-IN TAB */}
          <TabsContent value="checkin">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Check-In</CardTitle>
                <CardDescription>Scan each item as it returns from the event.</CardDescription>
                 <div className="pt-2">
                  <p className="text-sm font-medium">
                    Progress: {checkedInCount} / {totalToCheckIn} items returned
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Button className="w-full md:w-auto" disabled>
                  <Camera className="mr-2 h-4 w-4" /> Start Scanning (Coming Soon)
                </Button>
                <Separator />
                <ul className="space-y-2">
                  {checkInList.map((item, index) => (
                    <li key={`${item.equipmentId}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center">
                        {getStatusIcon(item.status)}
                         <span className="ml-3 font-medium">{item.name}</span>
                        <Badge variant="secondary" className="ml-2">Qty: {item.quantity}</Badge>
                      </div>
                       {totalToCheckIn === checkedInCount && item.status === 'not-scanned' && (
                        <div className="flex items-center text-red-500">
                          <XCircle className="h-4 w-4 mr-1"/>
                          <span className="text-xs font-semibold">MISSING</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
