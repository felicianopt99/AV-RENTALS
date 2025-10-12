
"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { EquipmentItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wrench, SearchSlash, History, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceLogDialog } from './MaintenanceLogDialog';
import { MaintenanceRequestDialog } from './MaintenanceRequestDialog';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export function MaintenanceManager() {
  const { equipment, isDataLoaded } = useAppContext();
  const router = useRouter();

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);

  const itemsInMaintenance = useMemo(() => {
    return equipment.filter(item => item.status === 'maintenance' || item.status === 'damaged');
  }, [equipment]);

  const handleAddLogClick = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setIsLogDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsLogDialogOpen(false);
    setSelectedEquipment(null);
  }

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">Loading maintenance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Maintenance
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Maintenance & Repairs</CardTitle>
          <CardDescription>Track items that are damaged or currently undergoing maintenance.</CardDescription>
        </CardHeader>
        <CardContent>
          {itemsInMaintenance.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
              <Wrench className="w-16 h-16 mb-4 text-primary/50" />
              <p className="text-xl mb-1">No items need attention.</p>
              <p className="text-sm">All equipment is in good condition.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Maintenance History</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsInMaintenance.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'damaged' ? 'destructive' : 'default'}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.maintenanceHistory?.length || 0} Entries</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => handleAddLogClick(item)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Log
                      </Button>
                       <Button variant="ghost" size="sm" onClick={() => router.push(`/equipment/${item.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Item
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {selectedEquipment && (
        <MaintenanceLogDialog 
            isOpen={isLogDialogOpen}
            onOpenChange={handleDialogClose}
            equipmentItem={selectedEquipment}
        />
      )}
      <MaintenanceRequestDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
