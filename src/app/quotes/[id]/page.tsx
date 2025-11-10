
// src/app/quotes/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Quote } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { FileText } from 'lucide-react';
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
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading quote data...</p>
            </div>
        </div>
    );
  }

  if (!quote) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">Quote not found or could not be loaded.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Quote</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Editing Quote #{quote.quoteNumber} • Created {new Date(quote.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <QuoteForm initialData={quote} />
      </div>
    </div>
  );
}
