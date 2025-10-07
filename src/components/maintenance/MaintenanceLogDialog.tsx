
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { EquipmentItem, EquipmentStatus } from "@/types";
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

const logSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(5, "Description must be at least 5 characters."),
  cost: z.coerce.number().min(0, "Cost cannot be negative.").optional(),
  updateStatus: z.string().optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

interface MaintenanceLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  equipmentItem: EquipmentItem;
}

export function MaintenanceLogDialog({ isOpen, onOpenChange, equipmentItem }: MaintenanceLogDialogProps) {
  const { addMaintenanceLog, updateEquipmentItem } = useAppContext();
  const { toast } = useToast();

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      cost: 0,
      updateStatus: "",
    },
  });

  function onSubmit(data: LogFormValues) {
    try {
      addMaintenanceLog({
        equipmentId: equipmentItem.id,
        date: data.date,
        description: data.description,
        cost: data.cost,
      });

      if (data.updateStatus && data.updateStatus !== equipmentItem.status) {
        updateEquipmentItem({ ...equipmentItem, status: data.updateStatus as EquipmentStatus });
      }

      toast({ title: "Maintenance Log Added", description: `Log added for ${equipmentItem.name}.` });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add log." });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Maintenance Log for "{equipmentItem.name}"</DialogTitle>
          <DialogDescription>
            Record a maintenance or repair activity. You can also update the item's status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Maintenance</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the work performed..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost ($) (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
                control={form.control}
                name="updateStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Status (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No Change" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Change</SelectItem>
                        {EQUIPMENT_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Add Log</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
