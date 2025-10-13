
"use client";

import { MaintenanceManager } from '@/components/maintenance/MaintenanceManager';


export default function MaintenancePage() {
  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <MaintenanceManager />
      </div>
    </div>
  );
}
