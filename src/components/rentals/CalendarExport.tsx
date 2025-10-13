"use client";

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface CalendarExportProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportICS: () => void;
}

export function CalendarExport({ onExportCSV, onExportPDF, onExportICS }: CalendarExportProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExportCSV} className="flex-shrink-0">
        <Download className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Export CSV</span>
        <span className="sm:hidden">CSV</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onExportPDF} className="flex-shrink-0">
        <Download className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Export PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onExportICS} className="flex-shrink-0">
        <Download className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Export ICS</span>
        <span className="sm:hidden">ICS</span>
      </Button>
    </div>
  );
}
