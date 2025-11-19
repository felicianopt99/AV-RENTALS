
// src/components/clients/ClientForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useTranslate } from '@/contexts/TranslationContext';
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
import { useAppDispatch } from "@/contexts/AppContext";
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
  // Translation hooks
  const { translated: toastFailedtosaveclientPlDescText } = useTranslate('Failed to save client. Please try again.');
  const { translated: toastErrorTitleText } = useTranslate('Error');
  const { translated: toastClientAddedTitleText } = useTranslate('Client Added');
  const { translated: toastClientUpdatedTitleText } = useTranslate('Client Updated');
  const { translated: labelClientName } = useTranslate('Client Name / Company');
  const { translated: phClientName } = useTranslate('e.g., Acme Corp or John Doe');
  const { translated: labelContactPerson } = useTranslate('Contact Person (Optional)');
  const { translated: phContactPerson } = useTranslate('e.g., Jane Smith');
  const { translated: labelEmail } = useTranslate('Email (Optional)');
  const { translated: phEmail } = useTranslate('e.g., contact@example.com');
  const { translated: labelPhone } = useTranslate('Phone (Optional)');
  const { translated: phPhone } = useTranslate('e.g., 555-123-4567');
  const { translated: labelAddress } = useTranslate('Address (Optional)');
  const { translated: phAddress } = useTranslate('e.g., 123 Main St, Anytown, USA');
  const { translated: labelNotes } = useTranslate('Notes (Optional)');
  const { translated: phNotes } = useTranslate('Any relevant notes about the client...');
  const { translated: notesDescription } = useTranslate('Internal notes for client management.');
  const { translated: btnUpdateClient } = useTranslate('Update Client');
  const { translated: btnAddClient } = useTranslate('Add Client');

  const { addClient, updateClient } = useAppDispatch();
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
        toast({ title: toastClientUpdatedTitleText, description: `Client "${data.name}" has been successfully updated.` });
      } else {
        addClient(data);
        toast({ title: toastClientAddedTitleText, description: `Client "${data.name}" has been successfully added.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/clients");
    } catch (error) {
      toast({ variant: "destructive", title: toastErrorTitleText, description: toastFailedtosaveclientPlDescText });
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
              <FormLabel>{labelClientName}</FormLabel>
              <FormControl>
                <Input placeholder={phClientName} {...field} />
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
              <FormLabel>{labelContactPerson}</FormLabel>
              <FormControl>
                <Input placeholder={phContactPerson} {...field} />
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
              <FormLabel>{labelEmail}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={phEmail} {...field} />
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
              <FormLabel>{labelPhone}</FormLabel>
              <FormControl>
                <Input placeholder={phPhone} {...field} />
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
              <FormLabel>{labelAddress}</FormLabel>
              <FormControl>
                <Textarea placeholder={phAddress} {...field} />
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
              <FormLabel>{labelNotes}</FormLabel>
              <FormControl>
                <Textarea placeholder={phNotes} {...field} rows={4} />
              </FormControl>
              <FormDescription>{notesDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full md:w-auto">
          {initialData ? btnUpdateClient : btnAddClient}
        </Button>
      </form>
    </Form>
  );
}

    