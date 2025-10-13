
// src/components/quotes/QuotesContent.tsx
"use client";

import { QuoteListDisplay } from '@/components/quotes/QuoteListDisplay';


export function QuotesContent() {
  return (
    <div className="flex flex-col min-h-screen">
      
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <QuoteListDisplay />
      </div>
    </div>
  );
}
