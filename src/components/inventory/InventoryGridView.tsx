

"use client";

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentItem } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { SearchSlash, Box } from 'lucide-react';
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
import { Separator } from '../ui/separator';

export function InventoryGridView() {
  const { equipment, categories, subcategories, deleteEquipmentItem, isDataLoaded } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);

  const { regularEquipment, consumableItems } = useMemo(() => {
    const filtered = equipment
      .filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => selectedCategory ? item.categoryId === selectedCategory : true)
      .filter(item => selectedStatus ? item.status === selectedStatus : true);
      
    return {
      regularEquipment: filtered.filter(item => item.type === 'equipment'),
      consumableItems: filtered.filter(item => item.type === 'consumable')
    };
  }, [equipment, searchTerm, selectedCategory, selectedStatus]);

  const groupedEquipment = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {};
    regularEquipment.forEach(item => {
      const category = categories.find(c => c.id === item.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [regularEquipment, categories]);

  const handleEdit = useCallback((item: EquipmentItem) => {
    router.push(`/equipment/${item.id}/edit`);
  }, [router]);

  const openDeleteConfirmDialog = useCallback((item: EquipmentItem) => {
    setItemToDelete(item);
  }, []);

  const confirmDelete = useCallback(() => {
    if (itemToDelete) {
      deleteEquipmentItem(itemToDelete.id);
      toast({ title: "Item Deleted", description: `"${itemToDelete.name}" has been removed.` });
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteEquipmentItem, toast]);

  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading inventory data...</p>
            </div>
        </div>
    );
  }

  const noItemsFound = regularEquipment.length === 0 && consumableItems.length === 0;

  return (
    <>
      <EquipmentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        categories={categories}
      />
    
      {noItemsFound ? (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
          <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
          <p className="text-xl mb-1">No items found.</p>
          <p className="text-sm">Try adjusting your filters or adding new equipment.</p>
        </div>
      ) : (
          <div className="space-y-12">
            {groupedEquipment.length > 0 && (
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
            )}
            
            {consumableItems.length > 0 && (
                <section className="px-2 md:px-0">
                    <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border/70 text-primary flex items-center">
                        <Box className="mr-3 h-8 w-8" /> Consumables
                    </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                        {consumableItems.map(item => (
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
            )}

          </div>
      )}

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
    </>
  );
}
