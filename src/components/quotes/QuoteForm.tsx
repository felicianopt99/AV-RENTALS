


// src/components/quotes/QuoteForm.tsx
"use client";
import React from "react";

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
import { CalendarIcon, PlusCircle, Trash2, X, FileText, Download, Eye } from "lucide-react";
import type { Quote, QuoteItem, Client, EquipmentItem, QuoteStatus } from "@/types";
import { QuotePDFPreview } from './QuotePDFPreview';
import { QuotePDFGenerator } from '@/lib/pdf-generator';
import { useAppContext, useAppDispatch } from "@/contexts/AppContext";
import { sampleServices, sampleFees } from '@/lib/sample-data';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useCallback, useState } from "react";
import { Separator } from "../ui/separator";

const QUOTE_STATUSES: QuoteStatus[] = ['Draft', 'Sent', 'Accepted', 'Declined', 'Archived'];
const MANUAL_CLIENT_ENTRY_VALUE = "__manual_client__";

const loadDraft = () => {
  if (typeof window !== 'undefined') {
    try {
      const draft = localStorage.getItem('quoteDraft');
      if (!draft || draft.trim() === '' || draft === 'undefined' || draft === 'null') {
        return {};
      }
      const parsed = JSON.parse(draft);
      // Validate items array to ensure all items have a type field
      if (parsed.items && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.filter((item: any) => item && item.type);
      }
      return parsed;
    } catch (error) {
      console.warn('Error parsing quote draft from localStorage:', error);
      // Clear the corrupted data
      try {
        localStorage.removeItem('quoteDraft');
      } catch (clearError) {
        console.warn('Error clearing corrupted quote draft:', clearError);
      }
      return {};
    }
  }
  return {};
};

const saveDraft = (data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('quoteDraft', JSON.stringify(data));
  }
};

const quoteItemSchema = z.object({
  id: z.string().optional(), // For existing items
  type: z.enum(['equipment', 'service', 'fee']),
  // Equipment fields
  equipmentId: z.string().optional(),
  equipmentName: z.string().optional(),
  // Service fields
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  // Fee fields
  feeId: z.string().optional(),
  feeName: z.string().optional(),
  // Common fields
  quantity: z.coerce.number().int().min(1).optional(), // For equipment/services
  unitPrice: z.coerce.number().min(0).optional(), // For equipment/services
  days: z.coerce.number().int().min(1).optional(), // For equipment/services
  lineTotal: z.coerce.number().min(0),
  // For fees
  amount: z.coerce.number().min(0).optional(),
  feeType: z.enum(['fixed', 'percentage']).optional(),
});

const quoteFormSchema = z.object({
  name: z.string().min(2, "Quote name must be at least 2 characters.").max(100),
  location: z.string().min(2, "Location is required.").max(100),
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
  onSubmitSuccess?: () => void;
}

export function QuoteForm({ initialData, onSubmitSuccess }: QuoteFormProps) {
  const { equipment, clients, isDataLoaded } = useAppContext();
  // Use sample data as fallback for services/fees
  const services = (typeof window !== 'undefined' && (window as any).services) || sampleServices;
  const fees = (typeof window !== 'undefined' && (window as any).fees) || sampleFees;
  const { addQuote, updateQuote } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  
  const rentableEquipment = equipment.filter(e => e.type === 'equipment');
  // Fallback for services/fees if not in context
  // (You may want to fetch these from API if not present)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    mode: 'onChange',
    defaultValues: initialData ? {
      ...initialData,
      startDate: new Date(initialData.startDate),
      endDate: new Date(initialData.endDate),
      items: initialData.items.map(item => ({
        id: item.id,
        type: item.type as 'equipment' | 'service' | 'fee',
        // Equipment fields
        equipmentId: item.equipmentId,
        equipmentName: item.equipmentName,
        // Service fields
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        // Fee fields
        feeId: item.feeId,
        feeName: item.feeName,
        amount: item.amount,
        feeType: item.feeType as 'fixed' | 'percentage' | undefined,
        // Common fields
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        days: item.days,
        lineTotal: item.lineTotal,
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
    ...loadDraft(),
    name: "",
    location: "",
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

  // PDF Preview state
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Auto-save status
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Clean up any invalid items without a type field (safety check for corrupted data)
  useEffect(() => {
    const invalidIndices: number[] = [];
    fields.forEach((field, index) => {
      if (!field.type) {
        invalidIndices.push(index);
      }
    });
    // Remove invalid items in reverse order to maintain correct indices
    invalidIndices.reverse().forEach(index => {
      console.warn('Removing invalid item without type at index', index);
      remove(index);
    });
  }, []); // Run only once on mount

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
    let feeTotal = 0;
    let percentageFeeTotal = 0;
    watchItems.forEach(item => {
      if (item.type === 'equipment' || item.type === 'service') {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0) * days;
        subTotal += isNaN(itemTotal) ? 0 : itemTotal;
      } else if (item.type === 'fee') {
        if (item.feeType === 'percentage') {
          percentageFeeTotal += item.amount || 0;
        } else {
          feeTotal += item.amount || 0;
        }
      }
    });

    let currentDiscountedSubTotal = subTotal;
    if (watchDiscountType === 'percentage') {
      currentDiscountedSubTotal = subTotal * (1 - (watchDiscountAmount / 100));
    } else { // fixed
      currentDiscountedSubTotal = subTotal - watchDiscountAmount;
    }
    currentDiscountedSubTotal = Math.max(0, currentDiscountedSubTotal);

    // Add fixed fees
    let totalWithFees = currentDiscountedSubTotal + feeTotal;
    // Add percentage fees
    if (percentageFeeTotal > 0) {
      totalWithFees += (currentDiscountedSubTotal * (percentageFeeTotal / 100));
    }

    const taxAmount = totalWithFees * (watchTaxRate / 100); // Use percentage from form state
    const totalAmount = totalWithFees + taxAmount;
    
    return { subTotal, discountedSubTotal: currentDiscountedSubTotal, feeTotal, percentageFeeTotal, taxAmount, totalAmount, days };
  }, [watchItems, watchStartDate, watchEndDate, watchDiscountAmount, watchDiscountType, watchTaxRate, rentalDays]);

  const { subTotal, discountedSubTotal, feeTotal, percentageFeeTotal, taxAmount, totalAmount, days } = calculateTotals();

  // Unified add item state
  const [addItemType, setAddItemType] = React.useState<'equipment'|'service'|'fee'>('equipment');
  const [selectedEquipmentId, setSelectedEquipmentId] = React.useState<string>(rentableEquipment[0]?.id || '');
  const [equipmentSearch, setEquipmentSearch] = React.useState('');
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>(services[0]?.id || '');
  const [selectedFeeId, setSelectedFeeId] = React.useState<string>(fees[0]?.id || '');
  const [addQuantity, setAddQuantity] = React.useState<number>(1);
  const [addUnitPrice, setAddUnitPrice] = React.useState<number>(0);
  const [addFeeType, setAddFeeType] = React.useState<'fixed'|'percentage'>('fixed');
  const [addFeeAmount, setAddFeeAmount] = React.useState<number>(0);

  // Add item handler
  const handleAddItem = () => {
    if (addItemType === 'equipment') {
      const eq = rentableEquipment.find(e => e.id === selectedEquipmentId);
      if (!eq) return toast({ variant: 'destructive', title: 'Select equipment' });
      append({
        type: 'equipment',
        equipmentId: eq.id,
        equipmentName: eq.name,
        quantity: addQuantity,
        unitPrice: eq.dailyRate,
        days,
        lineTotal: addQuantity * eq.dailyRate * days,
      });
    } else if (addItemType === 'service') {
      const svc = services.find((s: any) => s.id === selectedServiceId);
      if (!svc) return toast({ variant: 'destructive', title: 'Select service' });
      append({
        type: 'service',
        serviceId: svc.id,
        serviceName: svc.name,
        quantity: addQuantity,
        unitPrice: svc.unitPrice,
        days,
        lineTotal: addQuantity * svc.unitPrice * days,
      });
    } else if (addItemType === 'fee') {
      const fee = fees.find((f: any) => f.id === selectedFeeId);
      if (!fee) return toast({ variant: 'destructive', title: 'Select fee' });
      append({
        type: 'fee',
        feeId: fee.id,
        feeName: fee.name,
        amount: addFeeAmount || fee.amount,
        feeType: addFeeType || fee.type,
        lineTotal: addFeeType === 'percentage' ? 0 : (addFeeAmount || fee.amount), // recalc on submit
      });
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

  // Enhanced auto-save draft with status feedback
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const subscription = form.watch((value) => {
      setAutoSaveStatus('unsaved');
      
      // Debounce auto-save
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setAutoSaveStatus('saving');
        saveDraft(value);
        setTimeout(() => {
          setAutoSaveStatus('saved');
          setLastSaved(new Date());
        }, 300); // Short delay to show saving state
      }, 1000); // 1 second debounce
    });
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [form]);


  function onSubmit(data: QuoteFormValues) {
    const currentDays = rentalDays();
    const processedItems: QuoteItem[] = data.items.map((item) => {
      if (item.type === 'equipment') {
        const eq = equipment.find(e => e.id === item.equipmentId);
        const quantity = item.quantity ?? 1;
        const unitPrice = item.unitPrice ?? eq?.dailyRate ?? 0;
        const lineTotal = quantity * unitPrice * currentDays;
        return {
          id: item.id || crypto.randomUUID(),
          type: 'equipment',
          equipmentId: item.equipmentId,
          equipmentName: eq?.name || 'Unknown Equipment',
          quantity,
          unitPrice,
          days: currentDays,
          lineTotal: isNaN(lineTotal) ? 0 : lineTotal,
        };
      } else if (item.type === 'service') {
        const svc = services.find((s: any) => s.id === item.serviceId);
        const quantity = item.quantity ?? 1;
        const unitPrice = item.unitPrice ?? svc?.unitPrice ?? 0;
        const lineTotal = quantity * unitPrice * currentDays;
        return {
          id: item.id || crypto.randomUUID(),
          type: 'service',
          serviceId: item.serviceId,
          serviceName: svc?.name || 'Unknown Service',
          quantity,
          unitPrice,
          days: currentDays,
          lineTotal: isNaN(lineTotal) ? 0 : lineTotal,
        };
      } else {
        // fee
        const fee = fees.find((f: any) => f.id === item.feeId);
        return {
          id: item.id || crypto.randomUUID(),
          type: 'fee',
          feeId: item.feeId,
          feeName: fee?.name || 'Unknown Fee',
          amount: item.amount ?? fee?.amount ?? 0,
          feeType: item.feeType ?? fee?.type ?? 'fixed',
          lineTotal: item.feeType === 'percentage' ? 0 : (item.amount ?? fee?.amount ?? 0),
        };
      }
    });

    // Recalculate totals with final form values to be absolutely sure
    const finalTotals = calculateTotals(); 

    const finalClientId = data.clientId === MANUAL_CLIENT_ENTRY_VALUE ? undefined : data.clientId;

    const quoteData = {
      ...data,
      clientId: finalClientId,
      items: processedItems,
      subTotal: finalTotals.subTotal,
      discountAmount: data.discountAmount, // discountAmount is already watched
      discountType: data.discountType, // discountType is already watched
      taxAmount: finalTotals.taxAmount,
      totalAmount: finalTotals.totalAmount,
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
        localStorage.removeItem('quoteDraft'); // Clear draft after successful submit
        if (onSubmitSuccess) {
          onSubmitSuccess();
        } else {
          router.push(`/quotes/${newQuoteId}`);
        }
      }
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to save quote. Please try again."});
        console.error("Error saving quote:", error);
    }
  }

  // PDF Methods
  const createPreviewQuote = useCallback((): Quote => {
    const formValues = form.getValues();
    const currentDays = rentalDays();
    
    const processedItems: QuoteItem[] = formValues.items.map((item) => {
      if (item.type === 'equipment') {
        const eq = equipment.find(e => e.id === item.equipmentId);
        const quantity = item.quantity ?? 1;
        const unitPrice = item.unitPrice ?? eq?.dailyRate ?? 0;
        const lineTotal = quantity * unitPrice * currentDays;
        return {
          id: item.id || crypto.randomUUID(),
          type: 'equipment',
          equipmentId: item.equipmentId,
          equipmentName: eq?.name || 'Unknown Equipment',
          quantity,
          unitPrice,
          days: currentDays,
          lineTotal: isNaN(lineTotal) ? 0 : lineTotal,
        };
      } else if (item.type === 'service') {
        const svc = services.find((s: any) => s.id === item.serviceId);
        const quantity = item.quantity ?? 1;
        const unitPrice = item.unitPrice ?? svc?.unitPrice ?? 0;
        const lineTotal = quantity * unitPrice * currentDays;
        return {
          id: item.id || crypto.randomUUID(),
          type: 'service',
          serviceId: item.serviceId,
          serviceName: svc?.name || 'Unknown Service',
          quantity,
          unitPrice,
          days: currentDays,
          lineTotal: isNaN(lineTotal) ? 0 : lineTotal,
        };
      } else {
        const fee = fees.find((f: any) => f.id === item.feeId);
        return {
          id: item.id || crypto.randomUUID(),
          type: 'fee',
          feeId: item.feeId,
          feeName: fee?.name || 'Unknown Fee',
          amount: item.amount ?? fee?.amount ?? 0,
          feeType: item.feeType ?? fee?.type ?? 'fixed',
          lineTotal: item.feeType === 'percentage' ? 0 : (item.amount ?? fee?.amount ?? 0),
        };
      }
    });

    const totals = calculateTotals();
    const finalClientId = formValues.clientId === MANUAL_CLIENT_ENTRY_VALUE ? undefined : formValues.clientId;

    return {
      id: initialData?.id || 'preview',
      quoteNumber: initialData?.quoteNumber || `PREVIEW-${Date.now()}`,
      ...formValues,
      clientId: finalClientId,
      items: processedItems,
      subTotal: totals.subTotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      taxRate: (formValues.taxRate || 0) / 100,
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
    } as Quote;
  }, [form, equipment, services, fees, rentalDays, calculateTotals, initialData]);

  const handlePreviewPDF = useCallback(() => {
    const quote = createPreviewQuote();
    setPreviewQuote(quote);
    setIsPDFPreviewOpen(true);
  }, [createPreviewQuote]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsGeneratingPDF(true);
      const quote = createPreviewQuote();
      await QuotePDFGenerator.generateQuotePDF(quote, {
        filename: `quote-${quote.quoteNumber}.pdf`,
        download: true
      });
      toast({
        title: "PDF Downloaded",
        description: "Quote PDF has been downloaded successfully."
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: "Download Failed", 
        description: "There was an error generating the PDF."
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [createPreviewQuote, toast]);
  
  if (!isDataLoaded) {
    return <div className="flex justify-center items-center h-64"><p>Loading form data...</p></div>;
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enhanced Header Section */}
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl p-8 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 rounded-xl"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {initialData ? 'Edit Quote' : 'Create New Quote'}
                    </h1>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      Professional AV Equipment & Services
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {initialData && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-black/20 backdrop-blur-sm border border-blue-200 dark:border-blue-700 rounded-full">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quote #{initialData.quoteNumber}
                      </span>
                    </div>
                  )}
                  
                  {/* Auto-save Status Indicator */}
                  {!initialData && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-black/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full">
                      <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                        autoSaveStatus === 'saved' ? 'bg-green-500' :
                        autoSaveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {autoSaveStatus === 'saved' && lastSaved ? 
                          `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                          autoSaveStatus === 'saving' ? 'Saving...' :
                          'Draft'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/90 dark:bg-black/30 backdrop-blur-sm border border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-md">
                  <p className="font-bold text-gray-900 dark:text-white text-lg">AV RENTALS</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Est. 2020</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Professional Equipment Rental</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced Quote Information Section */}
        <Card className="border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Quote Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Basic details and status of your quote
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        Quote Name
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            placeholder="e.g., Summer Music Festival AV Package" 
                            {...field} 
                            className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        Quote Status
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
                            <SelectValue placeholder="Select quote status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg">
                          {QUOTE_STATUSES.map(status => (
                            <SelectItem key={status} value={status} className="rounded-md">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${
                                  status === 'Draft' ? 'bg-gray-400' :
                                  status === 'Sent' ? 'bg-blue-400' :
                                  status === 'Accepted' ? 'bg-green-400' :
                                  status === 'Declined' ? 'bg-red-400' :
                                  'bg-gray-400'
                                }`}></div>
                                {status}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Event & Client Information Section */}
        <Card className="border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-900/20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-transparent"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Event & Client Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Event location and client contact information
                  </p>
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Event Location */}
                <div className="bg-white/70 dark:bg-gray-800/50 p-6 rounded-xl border border-green-100 dark:border-green-800/50">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    Event Location
                  </h4>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          Venue / Location
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              placeholder="e.g., Grand Ballroom, Convention Center, or 123 Main Street" 
                              {...field} 
                              className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Client Selection */}
                <div className="bg-white/70 dark:bg-gray-800/50 p-6 rounded-xl border border-green-100 dark:border-green-800/50">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    Client Information
                  </h4>

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Select Existing Client (Optional)
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === MANUAL_CLIENT_ENTRY_VALUE || value === "") {
                              form.setValue("clientName", "");
                              form.setValue("clientEmail", "");
                              form.setValue("clientPhone", "");
                              form.setValue("clientAddress", "");
                            }
                          }}
                          value={field.value || MANUAL_CLIENT_ENTRY_VALUE}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
                              <SelectValue placeholder="Select existing client or enter manually..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg">
                            <SelectItem value={MANUAL_CLIENT_ENTRY_VALUE} className="rounded-md">
                              <div className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4 text-green-600" />
                                Enter New Client Details
                              </div>
                            </SelectItem>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id} className="rounded-md">
                                <div className="flex flex-col">
                                  <span className="font-medium">{client.name}</span>
                                  {client.email && (
                                    <span className="text-xs text-gray-500">{client.email}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <FormField control={form.control} name="clientName" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          Client Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              placeholder="Client's Full Name or Company" 
                              {...field} 
                              disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE}
                              className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="clientEmail" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Client Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              type="email" 
                              placeholder="client@company.com" 
                              {...field} 
                              disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE}
                              className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="clientPhone" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Client Phone
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              placeholder="Phone Number" 
                              {...field} 
                              disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE}
                              className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="clientAddress" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Client Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Textarea 
                              placeholder="Client's Address" 
                              {...field} 
                              disabled={!!watchClientId && watchClientId !== MANUAL_CLIENT_ENTRY_VALUE}
                              className="min-h-[48px] pl-4 pr-4 pt-3 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Quote Period Section */}
        <Card className="border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-900/20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Rental Period
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select the start and end dates for equipment rental
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      Start Date
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "h-12 w-full justify-start text-left font-normal border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                            {field.value ? format(field.value, "PPP") : <span>Select start date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-lg shadow-lg" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          initialFocus 
                          className="rounded-lg"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      End Date
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "h-12 w-full justify-start text-left font-normal border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                            {field.value ? format(field.value, "PPP") : <span>Select end date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-lg shadow-lg" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          disabled={(date) => date < (form.getValues("startDate") || new Date(0))} 
                          initialFocus 
                          className="rounded-lg"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                      Rental Duration
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-purple-900 dark:text-purple-300">
                      {days} day{days !== 1 ? 's' : ''}
                    </span>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      (Equipment rates are per day)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Quote Items Section */}
        <Card className="border border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-900/20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-transparent"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-md">
                    <PlusCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Equipment & Services
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add rental items, services, and fees to your quote
                    </p>
                  </div>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    {fields.length} item{fields.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* List all items (equipment, service, fee) */}
                {fields.map((field, index) => {
                  // Skip rendering items without a type (shouldn't happen, but safety check)
                  if (!field.type) {
                    console.warn('Skipping item without type at index', index, field);
                    return null;
                  }
                  return (
                    <Card
                      key={field.id}
                      className="group relative p-6 rounded-xl shadow-md border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-lg transition-all duration-300"
                    >
                      <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                  onClick={() => remove(index)}
                  aria-label="Remove item"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Item Type Badge */}
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm
                      ${field.type === 'equipment' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        field.type === 'service' ? 'bg-green-100 dark:bg-green-900/30' :
                        'bg-yellow-100 dark:bg-yellow-900/30'}`}
                    >
                      {field.type === 'equipment' && <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                      {field.type === 'service' && <PlusCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
                      {field.type === 'fee' && <CalendarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                          ${field.type === 'equipment' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            field.type === 'service' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}
                        >
                          {field.type}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {field.type === 'equipment' && field.equipmentName}
                        {field.type === 'service' && field.serviceName}
                        {field.type === 'fee' && field.feeName}
                      </h4>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {(field.type === 'equipment' || field.type === 'service') && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Qty:</span>
                          <span className="text-gray-900 dark:text-white font-semibold">{field.quantity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Rate:</span>
                          <span className="text-gray-900 dark:text-white font-semibold">
                            €{field.unitPrice?.toFixed(2)}{field.type === 'equipment' ? '/day' : ''}
                          </span>
                        </div>
                        {field.type === 'equipment' && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Days:</span>
                            <span className="text-gray-900 dark:text-white font-semibold">{days}</span>
                          </div>
                        )}
                      </>
                    )}
                    {field.type === 'fee' && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Type:</span>
                          <span className="text-gray-900 dark:text-white font-semibold capitalize">{field.feeType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Amount:</span>
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {field.feeType === 'percentage' ? `${field.amount}%` : `€${field.amount?.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Line Total */}
                  <div className="ml-auto">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-medium">Line Total</div>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        €{field.lineTotal?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
                  );
                })}
                
                {/* Enhanced Add Item Section */}
              {fields.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <PlusCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">No items added yet</h4>
                      <p className="text-gray-600 dark:text-gray-400">Add equipment, services, or fees to get started</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-xl p-6 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add New Item</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose the type of item you want to add to this quote</p>
                </div>
                
                {/* Enhanced Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAddItemType('equipment')}
                    className={`flex-1 min-w-fit px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                      ${addItemType === 'equipment' 
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-600'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      Equipment
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddItemType('service')}
                    className={`flex-1 min-w-fit px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50
                      ${addItemType === 'service' 
                        ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-600'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Service
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddItemType('fee')}
                    className={`flex-1 min-w-fit px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50
                      ${addItemType === 'fee' 
                        ? 'bg-yellow-500 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-600'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Fee
                    </div>
                  </button>
                </div>
                {/* Enhanced Tab Content */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                  {addItemType === 'equipment' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Search Equipment
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={equipmentSearch}
                              onChange={e => {
                                const value = e.target.value.trim();
                                setEquipmentSearch(value);
                                const match = rentableEquipment.find(eq => 
                                  eq.name.toLowerCase().replace(/\s+/g, '').includes(value.toLowerCase().replace(/\s+/g, ''))
                                );
                                if (match) setSelectedEquipmentId(match.id);
                                else setSelectedEquipmentId('');
                              }}
                              placeholder="Type to search equipment..."
                              className="w-full h-12 pl-4 pr-10 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200"
                              list="equipment-list"
                            />
                            <FileText className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <datalist id="equipment-list">
                              {rentableEquipment
                                .filter(eq => eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()))
                                .map(eq => (
                                  <option key={eq.id} value={eq.name} label={`€${eq.dailyRate.toFixed(2)}/day`}/>
                                ))}
                            </datalist>
                          </div>
                          {equipmentSearch && selectedEquipmentId && (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-blue-800 dark:text-blue-300">
                                  Selected: {rentableEquipment.find(eq => eq.id === selectedEquipmentId)?.name}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Quantity
                          </label>
                          <input 
                            type="number" 
                            min={1} 
                            value={addQuantity} 
                            onChange={e => setAddQuantity(Number(e.target.value))} 
                            className="w-full h-12 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg" 
                          onClick={() => {
                            let eqId = selectedEquipmentId;
                            if (!eqId && equipmentSearch) {
                              const match = rentableEquipment.find(eq => eq.name.toLowerCase() === equipmentSearch.toLowerCase());
                              if (match) eqId = match.id;
                            }
                            if (eqId) {
                              setSelectedEquipmentId(eqId);
                              handleAddItem();
                              setEquipmentSearch('');
                              setAddQuantity(1);
                            }
                          }}
                          disabled={!selectedEquipmentId}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> 
                          Add Equipment
                        </Button>
                      </div>
                    </div>
                  )}
                  {addItemType === 'service' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Select Service
                          </label>
                          <select 
                            value={selectedServiceId} 
                            onChange={e => setSelectedServiceId(e.target.value)} 
                            className="w-full h-12 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200"
                          >
                            {services.map((svc: any) => (
                              <option key={svc.id} value={svc.id}>
                                {svc.name} - €{svc.unitPrice.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Quantity
                          </label>
                          <input 
                            type="number" 
                            min={1} 
                            value={addQuantity} 
                            onChange={e => setAddQuantity(Number(e.target.value))} 
                            className="w-full h-12 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg" 
                          onClick={() => { 
                            handleAddItem(); 
                            setAddQuantity(1);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> 
                          Add Service
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {addItemType === 'fee' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Select Fee
                          </label>
                          <select 
                            value={selectedFeeId} 
                            onChange={e => setSelectedFeeId(e.target.value)} 
                            className="w-full h-12 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200"
                          >
                            {fees.map((fee: any) => (
                              <option key={fee.id} value={fee.id}>
                                {fee.name} - €{fee.amount.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Fee Type
                          </label>
                          <select 
                            value={addFeeType} 
                            onChange={e => setAddFeeType(e.target.value as any)} 
                            className="w-full h-12 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200"
                          >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Amount {addFeeType === 'percentage' ? '(%)' : '(€)'}
                          </label>
                          <input 
                            type="number" 
                            min={0} 
                            step={addFeeType === 'percentage' ? '0.1' : '0.01'}
                            value={addFeeAmount} 
                            onChange={e => setAddFeeAmount(Number(e.target.value))} 
                            className="w-full h-12 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg" 
                          onClick={() => { 
                            handleAddItem(); 
                            setAddFeeAmount(0);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> 
                          Add Fee
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && (
                <p className="text-sm font-medium text-destructive mt-4">{form.formState.errors.items.message}</p>
              )}
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Financial Summary Section */}
        <Card className="border border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-900 dark:to-emerald-900/20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Financial Summary
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure pricing, discounts, and tax calculations
                  </p>
                </div>
              </div>
              
              {/* Pricing Configuration */}
              <div className="bg-white/70 dark:bg-gray-800/50 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/50 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                  Pricing Configuration
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <FormField control={form.control} name="discountType" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Discount Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="fixed" className="rounded-md">Fixed Amount (€)</SelectItem>
                          <SelectItem value="percentage" className="rounded-md">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="discountAmount" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Discount Amount {watchDiscountType === 'percentage' ? '(%)' : '(€)'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={watchDiscountType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 50.00'}
                            {...field} 
                            className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="taxRate" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Tax Rate (%)
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="e.g., 23 for 23%" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              
              {/* Enhanced Financial Breakdown */}
              <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800/50 p-6 rounded-xl border border-emerald-200 dark:border-emerald-700 shadow-sm" aria-live="polite" aria-label="Financial summary">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Cost Breakdown</h4>
                </div>
                
                <div className="space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center py-2 border-b border-emerald-100 dark:border-emerald-800">
                    <span className="text-gray-700 dark:text-gray-300">Subtotal (Items & Services)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">€{subTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Discount */}
                  {watchDiscountAmount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-emerald-100 dark:border-emerald-800">
                      <span className="text-red-600 dark:text-red-400">
                        Discount {watchDiscountType === 'percentage' ? `(${watchDiscountAmount.toFixed(1)}%)` : ''}
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        - €{watchDiscountType === 'percentage' 
                          ? (subTotal * (watchDiscountAmount / 100)).toFixed(2)
                          : watchDiscountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Fees */}
                  {feeTotal > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-emerald-100 dark:border-emerald-800">
                      <span className="text-gray-700 dark:text-gray-300">Fixed Fees</span>
                      <span className="font-semibold text-gray-900 dark:text-white">€{feeTotal.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {percentageFeeTotal > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-emerald-100 dark:border-emerald-800">
                      <span className="text-gray-700 dark:text-gray-300">Percentage Fees ({percentageFeeTotal.toFixed(1)}%)</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        €{((discountedSubTotal) * (percentageFeeTotal / 100)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Pre-tax Total */}
                  <div className="flex justify-between items-center py-2 border-b border-emerald-100 dark:border-emerald-800">
                    <span className="text-gray-700 dark:text-gray-300">Total Before Tax</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      €{(discountedSubTotal + feeTotal + (percentageFeeTotal > 0 ? discountedSubTotal * (percentageFeeTotal / 100) : 0)).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Tax */}
                  {watchTaxRate > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-emerald-100 dark:border-emerald-800">
                      <span className="text-blue-600 dark:text-blue-400">Tax ({watchTaxRate.toFixed(1)}%)</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">€{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Final Total */}
                  <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 rounded-lg mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Amount</span>
                      <span className="text-2xl font-bold">€{totalAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-emerald-100 text-sm mt-1">
                      Final quote total including all items, discounts, fees, and taxes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Notes Section */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/50">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-transparent"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gray-600 rounded-lg flex items-center justify-center shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Additional Notes
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add any special instructions or additional information
                  </p>
                </div>
              </div>
              
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any special requirements, delivery instructions, setup notes, or other important information..."
                      {...field} 
                      rows={4}
                      className="min-h-[120px] p-4 border-2 border-gray-200 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 resize-vertical"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/20 p-6 lg:p-8 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Primary Action */}
            <div className="flex-1 w-full lg:w-auto">
              <Button 
                type="submit" 
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {initialData ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    {initialData ? "Update Quote" : "Create Quote"}
                  </div>
                )}
              </Button>
            </div>
            
            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handlePreviewPDF}
                className="h-14 px-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                disabled={form.formState.isSubmitting}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <span className="font-semibold">Preview PDF</span>
                </div>
              </Button>
              
              <Button
                type="button"
                variant="outline" 
                size="lg"
                onClick={handleDownloadPDF}
                className="h-14 px-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                disabled={isGeneratingPDF || form.formState.isSubmitting}
              >
                <div className="flex items-center gap-2">
                  {isGeneratingPDF ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isGeneratingPDF ? "Generating..." : "Download PDF"}
                  </span>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Helper Text */}
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Your quote will be automatically saved as a draft while you work. 
              <span className="font-semibold text-blue-600 dark:text-blue-400"> All changes are saved continuously.</span>
            </p>
          </div>
        </div>
        </form>
      </Form>

      {/* PDF Preview Modal */}
      <QuotePDFPreview
        quote={previewQuote}
        isOpen={isPDFPreviewOpen}
        onClose={() => {
          setIsPDFPreviewOpen(false);
          setPreviewQuote(null);
        }}
      />
    </>
  );
}

    