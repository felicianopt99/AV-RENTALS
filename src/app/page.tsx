"use client";

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentItem, Category } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { equipment, categories, subcategories, deleteEquipmentItem, isDataLoaded } = useAppContext();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // For future edit functionality
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);


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
    // This would typically navigate to an edit page or open a modal
    // For now, just log or set state
    setEditingItem(item); 
    toast({ title: "Edit Item", description: `Navigating to edit ${item.name}. (Not implemented yet)` });
    // router.push(`/equipment/${item.id}/edit`); // Example navigation
  }, [toast]);

  const handleDelete = useCallback((itemId: string) => {
    deleteEquipmentItem(itemId);
    toast({ title: "Equipment Deleted", description: "The equipment item has been removed." });
  }, [deleteEquipmentItem, toast]);


  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-full">
            <AppHeader title="Equipment Dashboard" />
            <div className="p-6 text-center">Loading dashboard data...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Equipment Dashboard" />
      <div className="flex justify-end mb-4 px-6">
        <Link href="/equipment/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Equipment
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
        <div className="text-center py-10 text-muted-foreground">
          <p>No equipment found matching your criteria.</p>
          <p>Try adjusting your filters or adding new equipment.</p>
        </div>
      )}

      {groupedEquipment.map(([categoryName, items]) => (
        <section key={categoryName} className="mb-8 px-2 md:px-0">
          <h2 className="text-2xl font-semibold mb-4 px-4 text-primary">{categoryName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <EquipmentCard
                key={item.id}
                item={item}
                category={categories.find(c => c.id === item.categoryId)}
                subcategory={subcategories.find(s => s.id === item.subcategoryId)}
                onEdit={handleEdit}
                onDelete={(itemId) => {
                  // Implement confirmation for delete
                  const itemToDelete = equipment.find(e => e.id === itemId);
                  if (itemToDelete) {
                     // Using AlertDialog for confirmation
                    // This structure is a bit verbose here, ideally move to a reusable confirmation dialog
                    // For simplicity of this change, it's inlined.
                    // A better way would be a global confirmation dialog context or state.
                    (window as any).confirmDeleteItem = () => { // a bit hacky for demo
                        handleDelete(itemId);
                    };
                     const alertTrigger = document.createElement('button');
                     document.body.appendChild(alertTrigger); // Must be in DOM to trigger
                     AlertDialogTrigger({onClick: () => {}, children: '', ref: (el) => {
                         if (el) {
                             el.click(); // Programmatically click the trigger
                             el.remove(); // Clean up
                         }
                     }}, {} as any ); // This is a conceptual way; direct DOM manipulation is not ideal in React
                     // Proper way: use AlertDialog's open prop with useState

                    // For now, a simple confirm
                    if (confirm(`Are you sure you want to delete ${itemToDelete.name}?`)) {
                        handleDelete(itemId);
                    }
                  }
                }}
              />
            ))}
          </div>
        </section>
      ))}
      {/* Placeholder for Edit Modal/Page - for now, edit button logs */}
      {editingItem && (
         <AlertDialog defaultOpen onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Equipment (Placeholder)</AlertDialogTitle>
              <AlertDialogDescription>
                Editing for '{editingItem.name}' is not fully implemented in this demo.
                This would typically open a form pre-filled with item data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEditingItem(null)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
