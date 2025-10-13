
// src/app/quotes/new/page.tsx
"use client";

import { QuoteForm } from '@/components/quotes/QuoteForm';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewQuotePage() {
  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>New Quote Details</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
