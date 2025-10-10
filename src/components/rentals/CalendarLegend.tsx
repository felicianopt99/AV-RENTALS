"use client";

import { Badge } from '@/components/ui/badge';

export function CalendarLegend() {
  return (
    <div className="flex items-center space-x-4 p-2 bg-muted rounded-md">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-primary rounded-sm"></div>
        <span className="text-sm">Rented Dates</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-destructive rounded-sm"></div>
        <span className="text-sm">Conflicts (Overbooked)</span>
      </div>
    </div>
  );
}
