
"use client";

import { EventListDisplay } from '@/components/events/EventListDisplay';
import { AppHeader } from '@/components/layout/AppHeader';

export default function EventsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Event Management" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <EventListDisplay />
      </div>
    </div>
  );
}
