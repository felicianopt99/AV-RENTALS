
"use client";

import { EventListDisplay } from '@/components/events/EventListDisplay';


export default function EventsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <EventListDisplay />
      </div>
    </div>
  );
}
