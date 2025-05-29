
// src/components/quotes/QuoteForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2, X } from "lucide-react";
import type { Quote, QuoteItem, Client, EquipmentItem, QuoteStatus } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useCallback } from "react";
import { Separator } from "../ui/separator";

const QUOTE_STATUSES: QuoteStatus[] = ['Draft', 'Sent', 'Accepted', 'Declined', 'Archived'];
const MANUAL_CLIENT_ENTRY_VALUE = "__manual_client__";

const quoteItemSchema = z.object({
  id: z.string().optional(), // For existing items
  equipmentId: z.string().min(1, "Equipment is required."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  // days and lineTotal are calculated
});

const quoteFormSchema = z.object({
  name: z.string().min(2, "Quote name must be at least 2 characters.").max(100),
  clientId: z.string().optional(),
  clientName: z.string().min(1, "Client name is required if not selecting an existing client.").max(100),
  clientEmail: z.string().email("Invalid email.").optional().or(z.literal('')),
  clientPhone: z.string().max(30).optional().or(z.literal('')),
  clientAddress: z.string().max(200).optional().or(z.literal('')),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  items: z.array(quoteItemSchema).min(1, "At least one item is required in the quote."),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(QUOTE_STATUSES as [QuoteStatus, ...QuoteStatus[]]),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  discountType: z.enum(['percentage', 'fixed']).optional().default('fixed'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0), // User inputs percentage e.g. 23 for 23%
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  initialData?: Quote;
}

export function QuoteForm({ initialData }: QuoteFormProps) {
  const { equipment, clients, addQuote, updateQuote, getNextQuoteNumber, isDataLoaded } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: new Date(initialData.startDate),
      endDate: new Date(initialData.endDate),
      items: initialData.items.map(item => ({
        id: item.id,
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      clientName: initialData.clientName || '',
      clientEmail: initialData.clientEmail || '',
      clientPhone: initialData.clientPhone || '',
      clientAddress: initialData.clientAddress || '',
      clientId: initialData.clientId || MANUAL_CLIENT_ENTRY_VALUE,
      discountAmount: initialData.discountAmount || 0,
      discountType: initialData.discountType || 'fixed',
      taxRate: (initialData.taxRate || 0) * 100, // Convert decimal to percentage for display/editing
    } : {
      name: "",
      clientId: MANUAL_CLIENT_ENTRY_VALUE,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      items: [],
      notes: "",
      status: "Draft",
      discountAmount: 0,
      discountType: 'fixed',
      taxRate: 0, // Default to 0%
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");
  const watchItems = form.watch("items");
  const watchDiscountAmount = form.watch("discountAmount");
  const watchDiscountType = form.watch("discountType");
  const watchTaxRate = form.watch("taxRate");
  const watchClientId = form.watch("clientId");

  useEffect(() => {
    if (watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE) {
      const selectedClient = clients.find(c => c.id === watchClientId);
      if (selectedClient) {
        form.setValue("clientName", selectedClient.name);
        form.setValue("clientEmail", selectedClient.email || "");
        form.setValue("clientPhone", selectedClient.phone || "");
        form.setValue("clientAddress", selectedClient.address || "");
      }
    } else if (watchClientId === MANUAL_CLIENT_ENTRY_VALUE) {
        // Fields are enabled, user can type.
        // If user explicitly selects "-- None --" AFTER having an existing client selected, clear fields.
        // This is handled by the onValueChange of the Select component.
    }
  }, [watchClientId, clients, form]);

  const rentalDays = useCallback(() => {
    if (watchStartDate && watchEndDate && watchEndDate >= watchStartDate) {
      return differenceInCalendarDays(watchEndDate, watchStartDate) + 1;
    }
    return 0;
  }, [watchStartDate, watchEndDate]);

  const calculateTotals = useCallback(() => {
    const days = rentalDays();
    let subTotal = 0;
    watchItems.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice * days;
      subTotal += isNaN(itemTotal) ? 0 : itemTotal;
    });

    let discountedSubTotal = subTotal;
    if (watchDiscountType === 'percentage') {
      discountedSubTotal = subTotal * (1 - (watchDiscountAmount / 100));
    } else { // fixed
      discountedSubTotal = subTotal - watchDiscountAmount;
    }
    discountedSubTotal = Math.max(0, discountedSubTotal);

    const taxAmount = discountedSubTotal * (watchTaxRate / 100); // Use percentage from form state
    const totalAmount = discountedSubTotal + taxAmount;
    
    return { subTotal, taxAmount, totalAmount, days };
  }, [watchItems, watchStartDate, watchEndDate, watchDiscountAmount, watchDiscountType, watchTaxRate, rentalDays]);

  const { subTotal, taxAmount, totalAmount, days } = calculateTotals();

  const handleAddEquipment = () => {
    if (equipment.length > 0) {
      const firstEquipment = equipment[0];
      append({
        equipmentId: firstEquipment.id,
        quantity: 1,
        unitPrice: firstEquipment.dailyRate,
      });
    } else {
      toast({ variant: "destructive", title: "No Equipment Available", description: "Please add equipment items first."})
    }
  };
  
  useEffect(() => {
    fields.forEach((field, index) => {
      const selectedEqId = form.watch(`items.${index}.equipmentId`);
      const currentUnitPrice = form.watch(`items.${index}.unitPrice`);
      const eq = equipment.find(e => e.id === selectedEqId);
      if (eq && eq.dailyRate !== currentUnitPrice && !form.getFieldState(`items.${index}.unitPrice`).isDirty) { 
        form.setValue(`items.${index}.unitPrice`, eq.dailyRate, { shouldValidate: true, shouldDirty: true });
      }
    });
  }, [fields, equipment, form]);


  function onSubmit(data: QuoteFormValues) {
    const currentDays = rentalDays();
    const processedItems: QuoteItem[] = data.items.map((item) => {
      const eq = equipment.find(e => e.id === item.equipmentId);
      const lineTotal = item.quantity * item.unitPrice * currentDays;
      return {
        id: item.id || crypto.randomUUID(),
        equipmentId: item.equipmentId,
        equipmentName: eq?.name || 'Unknown Equipment',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        days: currentDays,
        lineTotal: isNaN(lineTotal) ? 0 : lineTotal,
      };
    });

    const { subTotal, taxAmount, totalAmount } = calculateTotals(); // Recalculate with potentially final form values

    const finalClientId = data.clientId === MANUAL_CLIENT_ENTRY_VALUE ? undefined : data.clientId;

    const quoteData = {
      ...data,
      clientId: finalClientId,
      items: processedItems,
      subTotal,
      taxAmount,
      totalAmount,
      taxRate: data.taxRate / 100, // Convert percentage to decimal for storage
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
      endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
    };
    
    try {
      if (initialData) {
        updateQuote({ ...initialData, ...quoteData, updatedAt: new Date() });
        toast({ title: "Quote Updated", description: `Quote "${data.name}" has been successfully updated.` });
        router.push("/quotes");
      } else {
        const newQuoteId = addQuote(quoteData);
        toast({ title: "Quote Created", description: `Quote "${data.name}" has been successfully created.` });
        router.push(`/quotes/${newQuoteId}`);
      }
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to save quote. Please try again."});
        console.error("Error saving quote:", error);
    }
  }
  
  if (!isDataLoaded) {
    return <div className="flex justify-center items-center h-64"><p>Loading form data...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Summer Fest AV Package" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {QUOTE_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Separator />
        <h3 className="text-lg font-medium">Client Information</h3>
        
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Existing Client (Optional)</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value); // No longer need to convert MANUAL_CLIENT_ENTRY_VALUE to "" here
                  if (value === MANUAL_CLIENT_ENTRY_VALUE || value === "") {
                    form.setValue("clientName", "");
                    form.setValue("clientEmail", "");
                    form.setValue("clientPhone", "");
                    form.setValue("clientAddress", "");
                  }
                }} 
                value={field.value || MANUAL_CLIENT_ENTRY_VALUE}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Select existing client..." /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value={MANUAL_CLIENT_ENTRY_VALUE}>-- None (Enter Manually) --</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-8">
            <FormField control={form.control} name="clientName" render={({ field }) => (
                <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input placeholder="Client's Full Name or Company" {...field} disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="clientEmail" render={({ field }) => (
                <FormItem><FormLabel>Client Email</FormLabel><FormControl><Input type="email" placeholder="client@example.com" {...field} disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="clientPhone" render={({ field }) => (
                <FormItem><FormLabel>Client Phone</FormLabel><FormControl><Input placeholder="Client's Phone Number" {...field} disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="clientAddress" render={({ field }) => (
                <FormItem><FormLabel>Client Address</FormLabel><FormControl><Textarea placeholder="Client's Address" {...field} disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>

        <Separator />
        <h3 className="text-lg font-medium">Quote Period</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild>
            <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild>
            <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (form.getValues("startDate") || new Date(0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
          )} />
        </div>
        <p className="text-sm text-muted-foreground">Total rental duration: {days} day(s)</p>

        <Separator />
        <h3 className="text-lg font-medium">Equipment Items</h3>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4 relative shadow-sm border border-border/70">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                <X className="h-4 w-4" />
              </Button>
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <FormField control={form.control} name={`items.${index}.equipmentId`} render={({ field: itemField }) => (
                  <FormItem><FormLabel>Equipment</FormLabel>
                    <Select onValueChange={(value) => {
                        itemField.onChange(value);
                        const selectedEq = equipment.find(e => e.id === value);
                        if (selectedEq) {
                            form.setValue(`items.${index}.unitPrice`, selectedEq.dailyRate, { shouldValidate: true, shouldDirty: true });
                        }
                    }} defaultValue={itemField.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {equipment.map(eq => (
                          <SelectItem key={eq.id} value={eq.id}>{eq.name} (Rate: ${eq.dailyRate.toFixed(2)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: itemField }) => (
                  <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="1" {...itemField} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: itemField }) => (
                  <FormItem><FormLabel>Unit Price/Day ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...itemField} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <p className="text-xs text-muted-foreground mt-2">
                Line Total: ${( (form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitPrice`) || 0) * days ).toFixed(2)}
              </p>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={handleAddEquipment}><PlusCircle className="mr-2 h-4 w-4" /> Add Equipment Item</Button>
          {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && (
             <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>
          )}
        </div>
        
        <Separator />
        <h3 className="text-lg font-medium">Financial Summary</h3>
        <div className="grid md:grid-cols-3 gap-8 items-end">
            <FormField control={form.control} name="discountType" render={({ field }) => (
                <FormItem><FormLabel>Discount Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="fixed">Fixed ($)</SelectItem><SelectItem value="percentage">Percentage (%)</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="discountAmount" render={({ field }) => (
                <FormItem>
                    <FormLabel>Discount Amount {watchDiscountType === 'percentage' ? '(%)' : '($)'}</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="taxRate" render={({ field }) => (
                <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="e.g. 23 for 23%" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
        <Card className="p-4 bg-muted/30">
            <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>${subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>
                        {watchDiscountType === 'percentage' 
                            ? `(${watchDiscountAmount.toFixed(2)}%) - $${(subTotal * (watchDiscountAmount / 100)).toFixed(2)}`
                            : `- $${watchDiscountAmount.toFixed(2)}`}
                    </span>
                </div>
                 <div className="flex justify-between">
                    <span>Total Before Tax:</span>
                    <span>
                        $ {(discountedSubTotal).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between"><span>Tax ({ (watchTaxRate).toFixed(1)}%):</span><span>${taxAmount.toFixed(2)}</span></div>
                <Separator className="my-1 bg-border"/>
                <div className="flex justify-between font-bold text-lg"><span>Total Amount:</span><span>${totalAmount.toFixed(2)}</span></div>
            </div>
        </Card>

        <Separator />
        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional notes for this quote..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>
        )} />

        <Button type="submit" className="w-full md:w-auto">{initialData ? "Update Quote" : "Create Quote"}</Button>
      </form>
    </Form>
  );
}

