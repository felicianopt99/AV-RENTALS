// src/components/clients/ClientForm.tsx
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
import type { Client } from "@/types";
import { useAppContext } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const clientFormSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters.").max(100),
  contactPerson: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email("Invalid email address.").max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Client;
  onSubmitSuccess?: () => void;
}

export function ClientForm({ initialData, onSubmitSuccess }: ClientFormProps) {
  const { addClient, updateClient } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialData || {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  function onSubmit(data: ClientFormValues) {
    try {
      if (initialData) {
        updateClient({ ...initialData, ...data });
        toast({ title: "Client Updated", description: `Client "${data.name}" has been successfully updated.` });
      } else {
        addClient(data);
        toast({ title: "Client Added", description: `Client "${data.name}" has been successfully added.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/clients");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save client. Please try again." });
      console.error("Error saving client:", error);
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
              <FormLabel>Client Name / Company</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Acme Corp or John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., contact@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 555-123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 123 Main St, Anytown, USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any relevant notes about the client..." {...field} rows={4} />
              </FormControl>
              <FormDescription>Internal notes for client management.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full md:w-auto">
          {initialData ? "Update Client" : "Add Client"}
        </Button>
      </form>
    </Form>
  );
}
