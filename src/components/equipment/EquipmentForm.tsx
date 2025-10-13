

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { EquipmentItem, Category, Subcategory, EquipmentStatus, EquipmentType } from "@/types";
import { EQUIPMENT_STATUSES } from "@/lib/constants";
import { useAppContext, useAppDispatch } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import AIEquipmentAssistant from "./AIEquipmentAssistant";

const NO_SUBCATEGORY_VALUE = "__no_subcategory__";

const equipmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500),
  type: z.enum(["equipment", "consumable"] as [EquipmentType, ...EquipmentType[]]),
  categoryId: z.string().min(1, "Please select a category."),
  subcategoryId: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative."),
  dailyRate: z.coerce.number().min(0, "Daily rate cannot be negative.").optional().default(0),
  status: z.enum(["good", "damaged", "maintenance"] as [EquipmentStatus, ...EquipmentStatus[]], {
    required_error: "You need to select a status.",
  }),
  location: z.string().min(2, "Location must be at least 2 characters.").max(50),
  imageUrl: z.string().url("Please enter a valid URL for the image.").optional().or(z.literal('')),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

interface EquipmentFormProps {
  initialData?: EquipmentItem;
  onSubmitSuccess?: () => void;
}

export function EquipmentForm({ initialData, onSubmitSuccess }: EquipmentFormProps) {
  const { categories, subcategories: allSubcategories } = useAppContext();
  const { addEquipmentItem, updateEquipmentItem, refreshData } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      quantity: initialData.quantity || 0,
      dailyRate: initialData.dailyRate || 0,
      imageUrl: initialData.imageUrl || '',
      subcategoryId: initialData.subcategoryId || "", // Ensure empty string if undefined
      type: initialData.type || 'equipment',
    } : {
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      quantity: 0,
      dailyRate: 0,
      status: "good",
      location: "",
      imageUrl: "",
      type: "equipment",
    },
  });
  
  const selectedCategoryId = form.watch("categoryId");
  const itemType = form.watch("type");

  // Handle AI-generated equipment data
  const handleAIEquipmentGenerated = async (equipmentData: any, refreshDataCallback?: () => Promise<void>) => {
    console.log('AI Equipment Data received:', equipmentData);
    
    // If categories were created, refresh the data first
    if (refreshDataCallback) {
      console.log('Refreshing categories data...');
      await refreshDataCallback();
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Available categories:', categories);
    console.log('Available subcategories:', allSubcategories);
    
    let categoryId = "";
    let subcategoryId = "";

    // If AI assistant provided direct IDs (from newly created categories), use them
    if (equipmentData.categoryId) {
      categoryId = equipmentData.categoryId;
      console.log('Using direct categoryId:', categoryId);
    } else {
      // Find matching category by name
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(equipmentData.category.toLowerCase()) ||
        equipmentData.category.toLowerCase().includes(cat.name.toLowerCase())
      );
      categoryId = matchingCategory?.id || "";
      console.log('Found matching category:', matchingCategory, 'ID:', categoryId);
    }

    // Handle subcategory
    if (equipmentData.subcategoryId) {
      subcategoryId = equipmentData.subcategoryId;
      console.log('Using direct subcategoryId:', subcategoryId);
    } else if (equipmentData.subcategory && categoryId) {
      // Find matching subcategory by name
      const matchingSubcategory = allSubcategories.find(sub => 
        sub.parentId === categoryId &&
        (sub.name.toLowerCase().includes(equipmentData.subcategory.toLowerCase()) ||
         equipmentData.subcategory.toLowerCase().includes(sub.name.toLowerCase()))
      );
      subcategoryId = matchingSubcategory?.id || "";
      console.log('Found matching subcategory:', matchingSubcategory, 'ID:', subcategoryId);
    }

    // Update form with AI data
    form.setValue("name", equipmentData.name || "");
    form.setValue("description", equipmentData.description || "");
    form.setValue("categoryId", categoryId);
    form.setValue("subcategoryId", subcategoryId);
    form.setValue("dailyRate", equipmentData.dailyRate || 0);
    form.setValue("imageUrl", equipmentData.imageUrl || "");
    form.setValue("location", "Warehouse"); // Default location
    form.setValue("status", "good"); // Default status
    form.setValue("quantity", 1); // Default quantity

    toast({
      title: "AI Assistant",
      description: `Form filled with details for: ${equipmentData.name}`,
    });
  };

  useEffect(() => {
    if (selectedCategoryId) {
      const filteredSubs = allSubcategories.filter(sub => sub.parentId === selectedCategoryId);
      setAvailableSubcategories(filteredSubs);
      const currentSubcategoryId = form.getValues("subcategoryId");
      // If current subcategory is not in the new list of available ones, reset it
      if (currentSubcategoryId && !filteredSubs.find(s => s.id === currentSubcategoryId)) {
        form.setValue("subcategoryId", ""); // Reset to empty string for "No subcategory"
      }
    } else {
      setAvailableSubcategories([]);
      form.setValue("subcategoryId", "");
    }
  }, [selectedCategoryId, allSubcategories, form]);

  useEffect(() => {
    if (itemType === 'consumable') {
      form.setValue('dailyRate', 0);
    }
  }, [itemType, form]);


  function onSubmit(data: EquipmentFormValues) {
    try {
      const finalData = {
        ...data,
        subcategoryId: data.subcategoryId === NO_SUBCATEGORY_VALUE ? undefined : data.subcategoryId,
      };

      if (initialData) {
        updateEquipmentItem({ ...initialData, ...finalData });
        toast({ title: "Equipment Updated", description: `${finalData.name} has been successfully updated.` });
      } else {
        addEquipmentItem(finalData);
        toast({ title: "Equipment Added", description: `${finalData.name} has been successfully added.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/inventory");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save equipment. Please try again." });
      console.error("Error saving equipment:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* AI Equipment Assistant */}
        {!initialData && (
          <AIEquipmentAssistant 
            onEquipmentGenerated={handleAIEquipmentGenerated}
            refreshData={refreshData}
            disabled={false}
          />
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Shure SM58 Microphone" {...field} />
              </FormControl>
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
                <Textarea placeholder="Detailed description of the equipment..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Item Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="equipment" /></FormControl>
                    <FormLabel className="font-normal">Equipment (Rentable)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="consumable" /></FormControl>
                    <FormLabel className="font-normal">Consumable (Stock)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                'Equipment' is rentable. 'Consumable' is for tracking stock items like tape or batteries.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subcategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === NO_SUBCATEGORY_VALUE ? "" : value)}
                  value={field.value || NO_SUBCATEGORY_VALUE}
                  disabled={availableSubcategories.length === 0 && !selectedCategoryId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        !selectedCategoryId ? "Select a category first" :
                        availableSubcategories.length === 0 ? "No subcategories for selected category" :
                        "Select a subcategory"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     <SelectItem value={NO_SUBCATEGORY_VALUE}>No subcategory</SelectItem>
                    {availableSubcategories.map(subcat => (
                      <SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity in Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Rate (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" step="0.01" {...field} disabled={itemType === 'consumable'} />
                </FormControl>
                {itemType === 'consumable' && <FormDescription>Consumables cannot have a daily rate.</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 md:flex-row md:space-x-4 md:space-y-0"
                >
                  {EQUIPMENT_STATUSES.map(statusInfo => (
                    <FormItem key={statusInfo.value} className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={statusInfo.value} />
                      </FormControl>
                      <FormLabel className="font-normal">{statusInfo.label}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Physical Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Shelf A1, Warehouse B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormDescription>
                Provide a URL for the equipment image. Use placeholder e.g. https://placehold.co/600x400.png if none.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full md:w-auto">{initialData ? "Update Equipment" : "Add Equipment"}</Button>
      </form>
    </Form>
  );
}

    