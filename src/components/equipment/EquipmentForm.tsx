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
import type { EquipmentItem, Category, Subcategory, EquipmentStatus } from "@/types";
import { EQUIPMENT_STATUSES } from "@/lib/constants";
import { useAppContext } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const equipmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500),
  categoryId: z.string().min(1, "Please select a category."),
  subcategoryId: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative."),
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
  const { categories, subcategories: allSubcategories, addEquipmentItem, updateEquipmentItem } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      quantity: initialData.quantity || 0,
      imageUrl: initialData.imageUrl || '',
    } : {
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      quantity: 0,
      status: "good",
      location: "",
      imageUrl: "",
    },
  });
  
  const selectedCategoryId = form.watch("categoryId");

  useEffect(() => {
    if (selectedCategoryId) {
      setAvailableSubcategories(allSubcategories.filter(sub => sub.parentId === selectedCategoryId));
      // Reset subcategory if category changes and current subcategory is not valid for new category
      const currentSubcategoryId = form.getValues("subcategoryId");
      if (currentSubcategoryId && !allSubcategories.find(s => s.id === currentSubcategoryId && s.parentId === selectedCategoryId)) {
        form.setValue("subcategoryId", "");
      }
    } else {
      setAvailableSubcategories([]);
      form.setValue("subcategoryId", "");
    }
  }, [selectedCategoryId, allSubcategories, form]);


  function onSubmit(data: EquipmentFormValues) {
    try {
      if (initialData) {
        updateEquipmentItem({ ...initialData, ...data });
        toast({ title: "Equipment Updated", description: `${data.name} has been successfully updated.` });
      } else {
        addEquipmentItem(data);
        toast({ title: "Equipment Added", description: `${data.name} has been successfully added.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save equipment. Please try again." });
      console.error("Error saving equipment:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={availableSubcategories.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={availableSubcategories.length === 0 ? "No subcategories for selected category" : "Select a subcategory"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Available</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
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
