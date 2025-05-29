
// src/app/clients/page.tsx
"use client";

import { ClientListDisplay } from '@/components/clients/ClientListDisplay';
import { AppHeader } from '@/components/layout/AppHeader';

export default function ClientsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Client Management" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <ClientListDisplay />
      </div>
    </div>
  );
}
