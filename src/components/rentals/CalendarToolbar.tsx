"use client";

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarToolbarProps {
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onExport: () => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  currentMonth: string;
}

export function CalendarToolbar({
  onPrevMonth,
  onNextMonth,
  onToday,
  viewMode,
  onViewModeChange,
  currentMonth,
}: Omit<CalendarToolbarProps, 'onExport'>) {
  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          <CalendarDays className="h-4 w-4 mr-2" />
          Today
        </Button>
        <span className="text-lg font-semibold">{currentMonth}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Select value={viewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
