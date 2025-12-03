
// src/app/clients/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Client, Event, Quote } from '@/types';
import { useAppContext } from '@/contexts/AppContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Edit, FileText, PartyPopper, DollarSign, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

import { useTranslate } from '@/contexts/TranslationContext';
export default function ClientDetailsPage() {
  // Translation hooks
  const { translated: uiStatusText } = useTranslate('Status');
  const { translated: uiTotalText } = useTranslate('Total');
  const { translated: uiNameText } = useTranslate('Name');
  const { translated: uiNumberText } = useTranslate('Number');
  const { translated: uiQuoteHistoryText } = useTranslate('Quote History');
  const { translated: uiDateText } = useTranslate('Date');
  const { translated: uiLocationText } = useTranslate('Location');
  const { translated: uiEventText } = useTranslate('Event');
  const { translated: uiEventHistoryText } = useTranslate('Event History');
  const { translated: uiLifetimeValueText } = useTranslate('Lifetime Value');
  const { translated: uiClientNotesText } = useTranslate('Client Notes');
  const { translated: uiEditClientText } = useTranslate('Edit Client');
  const { translated: uiAccessDeniedText } = useTranslate('Access Denied');

  const params = useParams();
  const router = useRouter();
  const { clients, events, quotes, isDataLoaded, currentUser } = useAppContext();
  const isMobile = useIsMobile();

  const [client, setClient] = useState<Client | null>(null);
  const [clientEvents, setClientEvents] = useState<Event[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const clientId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        setClientEvents(events.filter(e => e.clientId === clientId).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        setClientQuotes(
          quotes
            .filter(q => q.clientId === clientId)
            .sort(
              (a,b) => (new Date(b.createdAt ?? 0)).getTime() - (new Date(a.createdAt ?? 0)).getTime()
            )
        );
      } else {
        router.replace('/clients');
      }
      setLoading(false);
    } else if (isDataLoaded && !clientId) {
      router.replace('/clients');
      setLoading(false);
    }
  }, [clientId, clients, events, quotes, isDataLoaded, router]);

  const clientValue = useMemo(() => {
    return clientQuotes
      .filter(q => q.status === 'Accepted')
      .reduce((total, q) => total + q.totalAmount, 0);
  }, [clientQuotes]);

  if (loading || !isDataLoaded) {
    return (
      <div className="flex flex-col min-h-screen">

        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <p className="text-lg text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    );
  }
  
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col h-full">
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
            <Card className="max-w-lg w-full bg-destructive/10 border-destructive/30">
                <CardHeader className="flex-row gap-4 items-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <div>
                        <CardTitle className="text-destructive">{uiAccessDeniedText}</CardTitle>
                        <CardDescription>You do not have permission to view client details.</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col min-h-screen">
        
        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <p className="text-lg text-destructive">Client not found.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl">{client.name}</CardTitle>
                  {client.contactPerson && <CardDescription className="text-base mt-1">Contact: {client.contactPerson}</CardDescription>}
                </div>
                <Button variant="outline" onClick={() => router.push(`/clients/${client.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" /> {uiEditClientText}</Button>
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {client.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a></div>}
                {client.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {client.phone}</div>}
                {client.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {client.address}</div>}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{uiClientNotesText}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{client.notes || 'No notes for this client.'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary"/> {uiLifetimeValueText}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€{clientValue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">From {clientQuotes.filter(q=>q.status === 'Accepted').length} accepted quotes.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PartyPopper className="w-5 h-5 text-primary"/> {uiEventHistoryText}</CardTitle>
            </CardHeader>
            <CardContent>
                {clientEvents.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    {isMobile ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {clientEvents.map(event => (
                          <div key={event.id} className="p-3 rounded-2xl bg-background/50 hover:bg-muted/30 transition-colors cursor-pointer border-0" onClick={() => router.push(`/events/${event.id}`)}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{event.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <span className="truncate">{event.location}</span>
                                  <span>•</span>
                                  <span>{format(new Date(event.startDate), 'MMM d')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Desktop Table View */
                      <ScrollArea className="h-64">
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead>{uiEventText}</TableHead><TableHead>{uiLocationText}</TableHead><TableHead>{uiDateText}</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {clientEvents.map(event => (
                              <TableRow key={event.id} className="cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell>{event.location}</TableCell>
                                <TableCell>{format(new Date(event.startDate), 'PP')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </>
                ) : <p className="text-sm text-muted-foreground">No events found for this client.</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/> {uiQuoteHistoryText}</CardTitle>
            </CardHeader>
            <CardContent>
                {clientQuotes.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    {isMobile ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {clientQuotes.map(quote => (
                          <div key={quote.id} className="p-3 rounded-2xl bg-background/50 hover:bg-muted/30 transition-colors cursor-pointer border-0" onClick={() => router.push(`/quotes/${quote.id}`)}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm">{quote.quoteNumber}</h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  {quote.name && <span className="truncate">{quote.name}</span>}
                                  <span>•</span>
                                  <span>€{quote.totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${quote.status === 'Accepted' ? 'bg-green-500' : quote.status === 'Sent' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Desktop Table View */
                      <ScrollArea className="h-64">
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead>{uiNumberText}</TableHead><TableHead>{uiNameText}</TableHead><TableHead>{uiTotalText}</TableHead><TableHead>{uiStatusText}</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {clientQuotes.map(quote => (
                              <TableRow key={quote.id} className="cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                                <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                                <TableCell>{quote.name}</TableCell>
                                <TableCell>€{quote.totalAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getStatusColor(quote.status)}>{quote.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </>
                ) : <p className="text-sm text-muted-foreground">No quotes found for this client.</p>}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

    