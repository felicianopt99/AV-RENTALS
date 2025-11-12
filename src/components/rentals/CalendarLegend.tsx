"use client";

import { Badge } from '@/components/ui/badge';

import { useTranslate } from '@/contexts/TranslationContext';
export function CalendarLegend() {
  // Translation hooks
  const { translated: uiRentedDatesText } = useTranslate('Rented Dates');

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-muted rounded-md mb-4">
      <span className="text-sm font-medium text-muted-foreground sm:hidden">Legend:</span>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary rounded-sm flex-shrink-0"></div>
          <span className="text-sm">{uiRentedDatesText}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-destructive rounded-sm flex-shrink-0"></div>
          <span className="text-sm">Conflicts (Overbooked)</span>
        </div>
      </div>
    </div>
  );
}
