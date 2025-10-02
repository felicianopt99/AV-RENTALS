
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import type { Event } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const addEquipmentSchema = z.object({
  equipmentId: z.string().min(1, "Please select an equipment."),
  quantityRented: z.coerce.number().int().min(1, "Quantity must be at least 1."),
});

type AddEquipmentFormValues = z.infer<typeof addEquipmentSchema>;

interface AddEquipmentToEventDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event: Event;
  onSubmitSuccess?: () => void;
}

export function AddEquipmentToEventDialog({ isOpen, onOpenChange, event, onSubmitSuccess }: AddEquipmentToEventDialogProps) {
  const { equipment, rentals, addRental, events } = useAppContext();
  const { toast } = useToast();
  const [availabilityConflict, setAvailabilityConflict] = useState<string | null>(null);

  const form = useForm<AddEquipmentFormValues>({
    resolver: zodResolver(addEquipmentSchema),
    defaultValues: {
      equipmentId: "",
      quantityRented: 1,
    },
  });

  const selectedEquipmentId = form.watch("equipmentId");
  const quantityToRent = form.watch("quantityRented");

  useEffect(() => {
    // Reset form when dialog opens
    if (isOpen) {
      form.reset({ equipmentId: "", quantityRented: 1 });
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (selectedEquipmentId && event.startDate && event.endDate && quantityToRent > 0) {
      const targetEquipment = equipment.find(e => e.id === selectedEquipmentId);
      if (!targetEquipment) {
        setAvailabilityConflict("Selected equipment not found.");
        return;
      }

      // Find all rentals for the selected equipment that overlap with the event dates
      const overlappingRentals = rentals.filter(r => {
        const rentalEvent = events.find(e => e.id === r.eventId);
        if (!rentalEvent) return false;
        
        return r.equipmentId === selectedEquipmentId &&
        (new Date(rentalEvent.startDate) <= new Date(event.endDate) && new Date(rentalEvent.endDate) >= new Date(event.startDate));
      });
      
      const rentedOutDuringPeriod = overlappingRentals.reduce((sum, r) => sum + r.quantityRented, 0);
      const availableQuantity = targetEquipment.quantity - rentedOutDuringPeriod;

      if (quantityToRent > availableQuantity) {
        setAvailabilityConflict(`Not enough stock. Available in this period: ${availableQuantity}, Requested: ${quantityToRent}.`);
      } else {
        setAvailabilityConflict(null);
      }
    } else {
      setAvailabilityConflict(null);
    }
  }, [selectedEquipmentId, quantityToRent, event, equipment, rentals, events]);


  function onSubmit(data: AddEquipmentFormValues) {
    if (availabilityConflict) {
      toast({ variant: "destructive", title: "Availability Conflict", description: availabilityConflict });
      return;
    }

    try {
      addRental({
        eventId: event.id,
        equipmentId: data.equipmentId,
        quantityRented: data.quantityRented,
      });
      toast({ title: "Equipment Added", description: `Successfully added to the event.` });
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add equipment." });
      console.error("Error adding rental:", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Equipment to "{event.name}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment to add" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipment.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name} (Total Stock: {eq.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantityRented"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Rent</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {availabilityConflict && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive-foreground flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                {availabilityConflict}
              </div>
            )}
            
            <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={!!availabilityConflict}>Add to Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
