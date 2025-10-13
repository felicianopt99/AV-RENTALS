
"use client";

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryGridView } from '@/components/inventory/InventoryGridView';
import { InventoryListView } from '@/components/inventory/InventoryListView';
import { InventoryAvailabilityView } from '@/components/inventory/InventoryAvailabilityView';
import { InventoryLabelGenerator } from '@/components/inventory/InventoryLabelGenerator';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, CalendarDays, QrCode, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export function InventoryContent() {
  const [activeTab, setActiveTab] = useState("grid");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      
      <div className="px-2 md:px-6 pt-2 md:pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Inventory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Equipment & Inventory</h1>
          <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="grid" className="text-xs md:text-sm">
              <LayoutGrid className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Grid View</span>
              <span className="sm:hidden">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs md:text-sm">
              <List className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="text-xs md:text-sm">
              <CalendarDays className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Availability</span>
              <span className="sm:hidden">Avail</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="text-xs md:text-sm">
              <QrCode className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Label Generator</span>
              <span className="sm:hidden">Labels</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="grid">
            <InventoryGridView />
          </TabsContent>
          <TabsContent value="list">
            <InventoryListView />
          </TabsContent>
          <TabsContent value="availability">
            <InventoryAvailabilityView />
          </TabsContent>
          <TabsContent value="labels">
            <InventoryLabelGenerator />
          </TabsContent>
        </Tabs>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
            </DialogHeader>
            <EquipmentForm onSubmitSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
