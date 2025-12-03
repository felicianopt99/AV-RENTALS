
// src/app/quotes/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Quote } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { useTranslate } from '@/contexts/TranslationContext';
export default function EditQuotePage() {
  // Translation hooks
  const { translated: toastNoquoteIDprovidedDescText } = useTranslate('No quote ID provided.');
  const { translated: toastQuotenotfoundDescText } = useTranslate('Quote not found.');
  const { translated: toastErrorTitleText } = useTranslate('Error');
  const { translated: loadingQuoteData } = useTranslate('Loading quote data...');
  const { translated: quoteNotFound } = useTranslate('Quote not found or could not be loaded.');
  const { translated: editQuoteTitle } = useTranslate('Edit Quote');
  const { translated: editingQuoteBase } = useTranslate('Editing Quote #{number} • Created {date}');
  const { translated: backToQuotesText } = useTranslate('Back to Quotes');

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
          createdAt: foundQuote.createdAt ? new Date(foundQuote.createdAt) : undefined,
          updatedAt: foundQuote.updatedAt ? new Date(foundQuote.updatedAt) : undefined,
          items: foundQuote.items.map(item => ({...item})) // Shallow copy items
        });
      } else {
        toast({ variant: "destructive", title: toastErrorTitleText, description: toastQuotenotfoundDescText});
        router.replace('/quotes'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !quoteId) {
        toast({ variant: "destructive", title: "Error", description: toastNoquoteIDprovidedDescText});
        router.replace('/quotes');
        setLoading(false);
    }
  }, [quoteId, quotes, isDataLoaded, router, toast]);

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">{loadingQuoteData}</p>
            </div>
        </div>
    );
  }

  if (!quote) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">{quoteNotFound}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="mb-4">
            <Link href="/quotes">
              <Button variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5 mr-2" />
                {backToQuotesText}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg bg-gray-800 dark:bg-gray-700">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{editQuoteTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {(editingQuoteBase || '')
                  .replace('{number}', String(quote.quoteNumber))
                  .replace('{date}', new Date(quote.createdAt ?? Date.now()).toLocaleDateString())}
              </p>
            </div>
          </div>
        </div>
        
        <QuoteForm initialData={quote} />
      </div>
    </div>
  );
}
