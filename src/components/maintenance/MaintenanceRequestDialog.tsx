"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAppDispatch } from '@/contexts/AppContext';
import type { EquipmentItem, MaintenanceLog } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceRequestDialog({ isOpen, onOpenChange }: MaintenanceRequestDialogProps) {
  const { equipment, categories } = useAppContext();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [status, setStatus] = useState<'maintenance' | 'damaged'>('maintenance');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [technician, setTechnician] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableEquipment = equipment.filter(item => item.status === 'good');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId || !description) return;

    setIsSubmitting(true);
    try {
      const selectedItem = equipment.find(item => item.id === selectedEquipmentId);
      if (!selectedItem) return;

      const newLog: MaintenanceLog = {
        id: Date.now().toString(),
        equipmentId: selectedEquipmentId,
        date: new Date(),
        description,
        cost: cost ? parseFloat(cost) : 0,
      };

      const updatedItem: EquipmentItem = {
        ...selectedItem,
        status,
        maintenanceHistory: [...(selectedItem.maintenanceHistory || []), newLog],
      };

      await dispatch.updateEquipmentItem(updatedItem);

      toast({
        title: "Maintenance request created",
        description: `${selectedItem.name} has been marked for ${status}.`,
      });

      // Reset form
      setSelectedEquipmentId('');
      setStatus('maintenance');
      setDescription('');
      setCost('');
      setTechnician('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create maintenance request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
          <DialogDescription>
            Select equipment and provide details for the maintenance or repair request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment" className="text-right">
                Equipment
              </Label>
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {availableEquipment.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={(value: 'maintenance' | 'damaged') => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue or maintenance needed"
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Cost ($)
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="technician" className="text-right">
                Technician
              </Label>
              <Input
                id="technician"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="Technician name"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedEquipmentId || !description}>
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
