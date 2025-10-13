
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
import { useIsMobile } from '@/hooks/use-mobile';

export function MaintenanceManager() {
  const { equipment, isDataLoaded } = useAppContext();
  const router = useRouter();
  const isMobile = useIsMobile();

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
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {itemsInMaintenance.map(item => (
                    <div key={item.id} className="p-3 rounded-2xl bg-background/50 hover:bg-muted/30 transition-colors border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{item.location}</span>
                            <span>•</span>
                            <span>{item.maintenanceHistory?.length || 0} entries</span>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${item.status === 'damaged' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                        <Button variant="ghost" size="sm" onClick={() => handleAddLogClick(item)} className="flex-1 h-7 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                          <PlusCircle className="mr-1 h-3 w-3" /> Log
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/equipment/${item.id}/edit`)} className="flex-1 h-7 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                          <Edit className="mr-1 h-3 w-3" /> Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
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
                          <Badge variant={item.status === 'damaged' ? 'destructive' : 'secondary'}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.maintenanceHistory?.length || 0} Entries</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="accentGhost" size="sm" onClick={() => handleAddLogClick(item)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Log
                          </Button>
                          <Button variant="accentGhost" size="sm" onClick={() => router.push(`/equipment/${item.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Item
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
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
