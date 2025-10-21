"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentItem, Client, Event } from '@/types';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const rentalSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  eventId: z.string().min(1, 'Event is required'),
  startDate: z.date(),
  endDate: z.date(),
  equipment: z.array(
    z.object({
      equipmentId: z.string().min(1, 'Equipment is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'At least one equipment item is required'),
  notes: z.string().optional(),
});

type RentalFormData = z.infer<typeof rentalSchema>;

interface RentalFormProps {
  initialDate?: Date;
  onSuccess?: () => void;
}

export function RentalForm({ initialDate, onSuccess }: RentalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { clients, events, equipment } = useAppContext();
  const [startDate, setStartDate] = useState<Date>(initialDate || new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(initialDate || new Date(), 1));

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      clientId: '',
      eventId: '',
      startDate,
      endDate,
      equipment: [],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'equipment',
  });

  useEffect(() => {
    form.setValue('startDate', startDate);
    form.setValue('endDate', endDate);
  }, [startDate, endDate, form]);

  const onSubmit = async (data: RentalFormData) => {
    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
          endDate: format(data.endDate, 'yyyy-MM-dd'),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Rental created successfully.',
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/rentals/calendar');
        }
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to create rental.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const addEquipmentItem = () => {
    append({ equipmentId: '', quantity: 1 });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select onValueChange={(value) => form.setValue('clientId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.clientId && (
              <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventId">Event</Label>
            <Select onValueChange={(value) => form.setValue('eventId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event: Event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.eventId && (
              <p className="text-sm text-destructive">{form.formState.errors.eventId.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rental Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Selection</CardTitle>
          <p className="text-sm text-muted-foreground">Add equipment items to rent</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex space-x-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Equipment</Label>
                  <Select onValueChange={(value) => form.setValue(`equipment.${index}.equipmentId`, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((item: EquipmentItem) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Available: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`equipment.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {form.formState.errors.equipment && (
              <p className="text-sm text-destructive">{form.formState.errors.equipment.message}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addEquipmentItem}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes about the rental..."
            {...form.register('notes')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push('/rentals/calendar')}>
          Cancel
        </Button>
        <Button type="submit">Create Rental</Button>
      </div>
    </form>
  );
}
