
// src/app/quotes/new/page.tsx
"use client";

import { QuoteForm } from '@/components/quotes/QuoteForm';
import { FileText } from 'lucide-react';

export default function NewQuotePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg bg-gray-800 dark:bg-gray-700">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Quote</h1>
              <p className="text-gray-600 dark:text-gray-400">Generate professional quotes for your AV rental services</p>
            </div>
          </div>
        </div>
        
        <QuoteForm />
      </div>
    </div>
  );
}
