
// src/app/rentals/[id]/edit/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { Rental } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { RentalForm } from '@/components/rentals/RentalForm';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

export default function EditRentalPage() {
  const params = useParams();
  const router = useRouter();
  const { rentals, deleteRental, isDataLoaded } = useAppContext();
  const { toast } = useToast();
  
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const rentalId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && rentalId) {
      const foundRental = rentals.find(r => r.id === rentalId);
      if (foundRental) {
        // Ensure dates are Date objects
        setRental({
          ...foundRental,
          startDate: new Date(foundRental.startDate),
          endDate: new Date(foundRental.endDate),
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Rental not found." });
        router.replace('/rentals/calendar'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !rentalId) {
      toast({ variant: "destructive", title: "Error", description: "No rental ID provided." });
      router.replace('/rentals/calendar');
      setLoading(false);
    }
  }, [rentalId, rentals, isDataLoaded, router, toast]);

  const handleDeleteConfirm = useCallback(() => {
    if (rental) {
      deleteRental(rental.id);
      toast({ title: "Rental Deleted", description: `Rental for "${rental.equipmentName}" has been removed.` });
      router.push('/rentals/calendar');
    }
    setIsDeleteDialogOpen(false);
  }, [rental, deleteRental, toast, router]);

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Edit Rental" />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading rental data...</p>
            </div>
        </div>
    );
  }

  if (!rental) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Edit Rental" />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-destructive">Rental not found or could not be loaded.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={`Edit Rental: ${rental.equipmentName} for ${rental.clientName}`} />
      <div className="p-4 md:p-6">
        <Card className="max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle>Edit Rental Details</CardTitle>
          </CardHeader>
          <CardContent>
            <RentalForm initialData={rental} />
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Rental
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rental for "{rental.equipmentName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
