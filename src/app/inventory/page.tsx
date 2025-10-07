
"use client";

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryGridView } from '@/components/inventory/InventoryGridView';
import { InventoryAvailabilityView } from '@/components/inventory/InventoryAvailabilityView';
import { InventoryLabelGenerator } from '@/components/inventory/InventoryLabelGenerator';
import { LayoutGrid, CalendarDays, QrCode } from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("grid");

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Inventory" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="grid">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="availability">
              <CalendarDays className="mr-2 h-4 w-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="labels">
              <QrCode className="mr-2 h-4 w-4" />
              Label Generator
            </TabsTrigger>
          </TabsList>
          <TabsContent value="grid">
            <InventoryGridView />
          </TabsContent>
          <TabsContent value="availability">
            <InventoryAvailabilityView />
          </TabsContent>
           <TabsContent value="labels">
            <InventoryLabelGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
