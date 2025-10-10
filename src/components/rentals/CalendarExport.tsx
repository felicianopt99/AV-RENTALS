"use client";

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface CalendarExportProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export function CalendarExport({ onExportCSV, onExportPDF }: CalendarExportProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={onExportCSV}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onExportPDF}>
        <Download className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
}
