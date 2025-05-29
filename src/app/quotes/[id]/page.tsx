
// src/app/quotes/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Quote } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const { quotes, isDataLoaded } = useAppContext();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const quoteId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && quoteId) {
      const foundQuote = quotes.find(q => q.id === quoteId);
      if (foundQuote) {
        // Ensure dates are Date objects
        setQuote({
          ...foundQuote,
          startDate: new Date(foundQuote.startDate),
          endDate: new Date(foundQuote.endDate),
          createdAt: new Date(foundQuote.createdAt),
          updatedAt: new Date(foundQuote.updatedAt),
          items: foundQuote.items.map(item => ({...item})) // Shallow copy items
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Quote not found."});
        router.replace('/quotes'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !quoteId) {
        toast({ variant: "destructive", title: "Error", description: "No quote ID provided."});
        router.replace('/quotes');
        setLoading(false);
    }
  }, [quoteId, quotes, isDataLoaded, router, toast]);

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Edit Quote" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading quote data...</p>
            </div>
        </div>
    );
  }

  if (!quote) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Edit Quote" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">Quote not found or could not be loaded.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={`Edit Quote: ${quote.name || quote.quoteNumber}`} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>Edit Quote Details ({quote.quoteNumber})</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteForm initialData={quote} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
