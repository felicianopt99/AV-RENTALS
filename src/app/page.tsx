
"use client";

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentItem, Category } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, SearchSlash, Package, Users, CalendarClock, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isFuture, isWithinInterval, addDays, startOfDay } from 'date-fns';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; description?: string }> = ({ title, value, icon: Icon, description }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { equipment, categories, subcategories, clients, rentals, deleteEquipmentItem, isDataLoaded } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);

  const filteredEquipment = useMemo(() => {
    return equipment
      .filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => selectedCategory ? item.categoryId === selectedCategory : true)
      .filter(item => selectedStatus ? item.status === selectedStatus : true);
  }, [equipment, searchTerm, selectedCategory, selectedStatus]);

  const groupedEquipment = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {};
    filteredEquipment.forEach(item => {
      const category = categories.find(c => c.id === item.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEquipment, categories]);

  const handleEdit = useCallback((item: EquipmentItem) => {
    router.push(`/equipment/${item.id}/edit`);
  }, [router]);

  const openDeleteConfirmDialog = useCallback((item: EquipmentItem) => {
    setItemToDelete(item);
  }, []);

  const confirmDelete = useCallback(() => {
    if (itemToDelete) {
      deleteEquipmentItem(itemToDelete.id);
      toast({ title: "Equipment Deleted", description: `"${itemToDelete.name}" has been removed.` });
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteEquipmentItem, toast]);

  const dashboardStats = useMemo(() => {
    if (!isDataLoaded) return { totalEquipment: 0, totalClients: 0, upcomingRentals: 0, maintenanceItems: 0 };
    
    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 7);

    const upcomingRentalsCount = rentals.filter(rental => {
        const rentalStartDate = startOfDay(new Date(rental.startDate)); // Ensure date objects for comparison
        const rentalEndDate = startOfDay(new Date(rental.endDate)); // Though not strictly needed for this logic, good practice
        
        // Check if the rental's start date is in the future and within the next 7 days from today.
        return isFuture(rentalStartDate) && 
               isWithinInterval(rentalStartDate, { start: today, end: sevenDaysFromNow });
    }).length;

    return {
      totalEquipment: equipment.length,
      totalClients: clients.length,
      upcomingRentals: upcomingRentalsCount,
      maintenanceItems: equipment.filter(e => e.status === 'maintenance').length,
    };
  }, [equipment, clients, rentals, isDataLoaded]);

  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Equipment Dashboard" />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Equipment Dashboard" />
      <div className="px-4 md:px-6 pt-4 pb-6">
        
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Equipment" value={dashboardStats.totalEquipment} icon={Package} />
          <StatCard title="Total Clients" value={dashboardStats.totalClients} icon={Users} />
          <StatCard title="Upcoming Rentals" value={dashboardStats.upcomingRentals} icon={CalendarClock} description="In next 7 days" />
          <StatCard title="Needs Maintenance" value={dashboardStats.maintenanceItems} icon={Wrench} />
        </div>

        <div className="flex justify-end mb-6">
          <Link href="/equipment/new" passHref>
            <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Equipment
            </Button>
          </Link>
        </div>
        <EquipmentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          categories={categories}
        />
      
        {groupedEquipment.length === 0 && (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
            <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
            <p className="text-xl mb-1">No equipment found.</p>
            <p className="text-sm">Try adjusting your filters or adding new equipment.</p>
          </div>
        )}
        
        <div className="space-y-12">
          {groupedEquipment.map(([categoryName, items]) => (
            <section key={categoryName} className="px-2 md:px-0">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border/70 text-primary">
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                {items.map(item => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    category={categories.find(c => c.id === item.categoryId)}
                    subcategory={subcategories.find(s => s.id === item.subcategoryId)}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => openDeleteConfirmDialog(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
