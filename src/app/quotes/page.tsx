
// src/app/quotes/page.tsx
"use client";

import { QuoteListDisplay } from '@/components/quotes/QuoteListDisplay';
import { AppHeader } from '@/components/layout/AppHeader';

export default function QuotesPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Quote Management" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <QuoteListDisplay />
      </div>
    </div>
  );
}
