

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
import { QRCodeScanner } from '@/components/rentals/QRCodeScanner';
import { useToast } from '@/hooks/use-toast';

type PrepItem = {
  equipmentId: string;
  name: string;
  quantity: number;
  scannedQuantity: number;
};

export default function RentalPrepPage() {
  const params = useParams();
  const router = useRouter();
  const { events, rentals, equipment, isDataLoaded, clients } = useAppContext();
  const eventId = typeof params.id === 'string' ? params.id : undefined;

  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const [prepList, setPrepList] = useState<PrepItem[]>([]);
  const [checkInList, setCheckInList] = useState<PrepItem[]>([]);
  
  const [isScanningCheckout, setIsScanningCheckout] = useState(false);
  const [isScanningCheckin, setIsScanningCheckin] = useState(false);

  const client = useMemo(() => {
    if (!event) return null;
    return clients.find(c => c.id === event.clientId);
  }, [event, clients]);

  useEffect(() => {
    if (isDataLoaded && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        
        const eventRentals = rentals.filter(r => r.eventId === eventId);
        
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
        
        const itemsToPrep: PrepItem[] = Object.values(aggregatedItems).map(item => ({
            ...item,
            scannedQuantity: 0,
        }));

        setPrepList(itemsToPrep);
        setCheckInList(itemsToPrep.map(i => ({...i, scannedQuantity: 0})));

      } else {
        router.replace('/events'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !eventId) {
        router.replace('/events');
        setLoading(false);
    }
  }, [eventId, events, rentals, equipment, isDataLoaded, router]);
  
  const handleScan = (result: string, scanType: 'checkout' | 'checkin') => {
    try {
        const url = new URL(result);
        const pathSegments = url.pathname.split('/');
        const equipmentId = pathSegments[pathSegments.length - 2]; // Assuming URL is /equipment/{id}/edit

        const listToUpdate = scanType === 'checkout' ? prepList : checkInList;
        const setList = scanType === 'checkout' ? setPrepList : setCheckInList;
        
        const itemIndex = listToUpdate.findIndex(item => item.equipmentId === equipmentId);

        if (itemIndex > -1) {
            setList(currentList => {
                const newList = [...currentList];
                const item = newList[itemIndex];
                if(item.scannedQuantity < item.quantity) {
                    newList[itemIndex] = { ...item, scannedQuantity: item.scannedQuantity + 1};
                    toast({title: "Scan Successful", description: `1x ${item.name} scanned.`});
                } else {
                    toast({variant: "destructive", title: "Scan Limit Reached", description: `All ${item.quantity} units of ${item.name} already scanned.`});
                }
                return newList;
            });
        } else {
            toast({variant: "destructive", title: "Scan Error", description: "This equipment does not belong to this event."});
        }
    } catch(e) {
        console.error("Invalid QR code data", e);
        toast({variant: "destructive", title: "Invalid QR Code", description: "The scanned QR code is not a valid equipment URL."});
    }
  };


  const { checkedOutCount, totalToCheckout } = useMemo(() => ({
    checkedOutCount: prepList.reduce((sum, i) => sum + i.scannedQuantity, 0),
    totalToCheckout: prepList.reduce((sum, i) => sum + i.quantity, 0)
  }), [prepList]);

  const { checkedInCount, totalToCheckIn } = useMemo(() => ({
    checkedInCount: checkInList.reduce((sum, i) => sum + i.scannedQuantity, 0),
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
  
  const getStatusIcon = (scanned: number, total: number) => {
    if (scanned === 0) return <Circle className="h-5 w-5 text-muted-foreground" />;
    if (scanned < total) return <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">{scanned}</div>;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
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
                <Button className="w-full md:w-auto" onClick={() => setIsScanningCheckout(true)}>
                  <Camera className="mr-2 h-4 w-4" /> Start Scanning
                </Button>
                <Separator />
                <ul className="space-y-2">
                  {prepList.map((item, index) => (
                    <li key={`${item.equipmentId}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center">
                        {getStatusIcon(item.scannedQuantity, item.quantity)}
                        <span className="ml-3 font-medium">{item.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {item.scannedQuantity} / {item.quantity}
                        </Badge>
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
                 <Button className="w-full md:w-auto" onClick={() => setIsScanningCheckin(true)}>
                  <Camera className="mr-2 h-4 w-4" /> Start Scanning
                </Button>
                <Separator />
                <ul className="space-y-2">
                  {checkInList.map((item, index) => (
                    <li key={`${item.equipmentId}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center">
                        {getStatusIcon(item.scannedQuantity, item.quantity)}
                         <span className="ml-3 font-medium">{item.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {item.scannedQuantity} / {item.quantity}
                        </Badge>
                      </div>
                       {totalToCheckIn > 0 && checkedInCount === totalToCheckIn && item.scannedQuantity < item.quantity && (
                        <div className="flex items-center text-red-500">
                          <XCircle className="h-4 w-4 mr-1"/>
                          <span className="text-xs font-semibold">MISSING: {item.quantity - item.scannedQuantity}</span>
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
      
      {isScanningCheckout && (
        <QRCodeScanner
            isOpen={isScanningCheckout}
            onOpenChange={setIsScanningCheckout}
            onScan={(result) => handleScan(result, 'checkout')}
        />
      )}

      {isScanningCheckin && (
        <QRCodeScanner
            isOpen={isScanningCheckin}
            onOpenChange={setIsScanningCheckin}
            onScan={(result) => handleScan(result, 'checkin')}
        />
      )}
    </div>
  );
}
