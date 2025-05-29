
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import type { Rental, EquipmentItem, Client } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const rentalFormSchema = z.object({
  equipmentId: z.string().min(1, "Please select an equipment."),
  clientId: z.string().min(1, "Please select a client."),
  quantityRented: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  eventLocation: z.string().min(2, "Event location is required.").max(100),
  internalResponsible: z.string().min(2, "Internal responsible is required.").max(100),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

interface RentalFormProps {
  initialData?: Rental;
  onSubmitSuccess?: () => void;
}

export function RentalForm({ initialData, onSubmitSuccess }: RentalFormProps) {
  const { equipment, clients, rentals, addRental, updateRental } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [availabilityConflict, setAvailabilityConflict] = useState<string | null>(null);

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: new Date(initialData.startDate),
      endDate: new Date(initialData.endDate),
    } : {
      equipmentId: "",
      clientId: "",
      quantityRented: 1,
      startDate: undefined,
      endDate: undefined,
      eventLocation: "",
      internalResponsible: "",
    },
  });
  
  const selectedEquipmentId = form.watch("equipmentId");
  const selectedStartDate = form.watch("startDate");
  const selectedEndDate = form.watch("endDate");
  const quantityToRent = form.watch("quantityRented");

  useEffect(() => {
    if (selectedEquipmentId && selectedStartDate && selectedEndDate && quantityToRent > 0) {
      const targetEquipment = equipment.find(e => e.id === selectedEquipmentId);
      if (!targetEquipment) {
        setAvailabilityConflict("Selected equipment not found.");
        return;
      }

      const overlappingRentals = rentals.filter(r => 
        r.equipmentId === selectedEquipmentId &&
        r.id !== initialData?.id && // Exclude current rental if editing
        ((new Date(r.startDate) <= selectedEndDate && new Date(r.endDate) >= selectedStartDate))
      );
      
      const rentedOutDuringPeriod = overlappingRentals.reduce((sum, r) => sum + r.quantityRented, 0);
      const availableQuantity = targetEquipment.quantity - rentedOutDuringPeriod;

      if (quantityToRent > availableQuantity) {
        setAvailabilityConflict(`Not enough stock. Available: ${availableQuantity}, Requested: ${quantityToRent}. Check existing rentals for overlaps.`);
      } else {
        setAvailabilityConflict(null);
      }
    } else {
      setAvailabilityConflict(null);
    }
  }, [selectedEquipmentId, selectedStartDate, selectedEndDate, quantityToRent, equipment, rentals, initialData?.id]);


  function onSubmit(data: RentalFormValues) {
    if (availabilityConflict) {
      toast({ variant: "destructive", title: "Availability Conflict", description: availabilityConflict });
      return;
    }

    const selectedEq = equipment.find(e => e.id === data.equipmentId);
    const selectedClient = clients.find(c => c.id === data.clientId);

    if (!selectedEq) {
        toast({ variant: "destructive", title: "Error", description: "Selected equipment not found." });
        return;
    }
    if (!selectedClient) {
        toast({ variant: "destructive", title: "Error", description: "Selected client not found." });
        return;
    }

    try {
      const rentalData = { 
        ...data, 
        equipmentName: selectedEq.name,
        clientName: selectedClient.name, // Store client name for convenience
      };

      if (initialData) {
        updateRental({ ...initialData, ...rentalData });
        toast({ title: "Rental Updated", description: `Rental for ${selectedEq.name} has been updated.` });
      } else {
        addRental(rentalData);
        toast({ title: "Rental Created", description: `Rental for ${selectedEq.name} has been created.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/rentals/calendar");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save rental. Please try again." });
      console.error("Error saving rental:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="equipmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipment</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment to rent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {equipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} (Available: {eq.quantity})
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
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
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

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="eventLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grand Ballroom, City Hall" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="internalResponsible"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Responsible</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe (Sales)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full md:w-auto" disabled={!!availabilityConflict}>
          {initialData ? "Update Rental" : "Create Rental"}
        </Button>
      </form>
    </Form>
  );
}
