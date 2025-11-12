 

"use client";

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentItem } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { SearchSlash, Box, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useTranslate } from '@/contexts/TranslationContext';
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
  // Translation hooks
  const { translated: uiDeleteText } = useTranslate('Delete');
  const { translated: uiCancelText } = useTranslate('Cancel');
  const { translated: uiConfirmDeletionText } = useTranslate('Confirm Deletion');
  const { translated: uiNextText } = useTranslate('Next');
  const { translated: uiPreviousText } = useTranslate('Previous');
  const { translated: uiConsumablesText } = useTranslate('Consumables');
  const { translated: uiLocationText } = useTranslate('Location');
  const { translated: uiDailyRateText } = useTranslate('Daily Rate');
  const { translated: uiStatusText } = useTranslate('Status');
  const { translated: uiQuantityText } = useTranslate('Quantity');
  const { translated: uiNameText } = useTranslate('Name');
  const { translated: toastItemDeletedTitleText } = useTranslate('Item Deleted');

  const { equipment, categories, subcategories, rentals, events, isDataLoaded } = useAppContext();
  const { deleteEquipmentItem } = useAppDispatch();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'status' | 'dailyRate' | 'location'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);

  const locations = useMemo(() => [...new Set(equipment.map(item => item.location))].sort(), [equipment]);

  const isCurrentlyRented = useCallback((equipmentId: string) => {
    return rentals.some(rental => {
      if (rental.equipmentId !== equipmentId) return false;
      const event = events.find(e => e.id === rental.eventId);
      if (!event) return false;
      const now = new Date();
      return event.startDate <= now && now <= event.endDate;
    });
  }, [rentals, events]);

  const sortItems = useCallback((items: EquipmentItem[]) => {
    return [...items].sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      if (sortBy === 'status') {
        aValue = EQUIPMENT_STATUSES.find(s => s.value === a.status)?.label || a.status;
        bValue = EQUIPMENT_STATUSES.find(s => s.value === b.status)?.label || b.status;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }

      return 0;
    });
  }, [sortBy, sortOrder]);

  const { regularEquipment, consumableItems } = useMemo(() => {
    const filtered = equipment
      .filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => selectedCategory ? item.categoryId === selectedCategory : true)
      .filter(item => selectedSubcategory ? item.subcategoryId === selectedSubcategory : true)
      .filter(item => selectedStatus ? item.status === selectedStatus : true)
      .filter(item => selectedLocation ? item.location === selectedLocation : true)
      .filter(item => selectedType ? item.type === selectedType : true)
      .filter(item => {
        if (selectedAvailability === 'all') return true;
        const rented = isCurrentlyRented(item.id);
        return selectedAvailability === 'rented' ? rented : !rented;
      });

    return {
      regularEquipment: filtered.filter(item => item.type === 'equipment'),
      consumableItems: filtered.filter(item => item.type === 'consumable')
    };
  }, [equipment, searchTerm, selectedCategory, selectedSubcategory, selectedStatus, selectedLocation, selectedType, selectedAvailability, isCurrentlyRented]);

  const paginatedRegular = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return regularEquipment.slice(start, start + itemsPerPage);
  }, [regularEquipment, currentPage]);

  const groupedEquipment = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {};
    paginatedRegular.forEach(item => {
      const category = categories.find(c => c.id === item.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [paginatedRegular, categories]);

  const totalPages = Math.ceil(regularEquipment.length / itemsPerPage);

  const handleEdit = useCallback((item: EquipmentItem) => {
    router.push(`/equipment/${item.id}/edit`);
  }, [router]);

  const openDeleteConfirmDialog = useCallback((item: EquipmentItem) => {
    setItemToDelete(item);
  }, []);

  const confirmDelete = useCallback(() => {
    if (itemToDelete) {
      deleteEquipmentItem(itemToDelete.id);
      toast({ title: "{toastItemDeletedTitleText}", description: `"${itemToDelete.name}" has been removed.` });
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteEquipmentItem, toast]);

  if (!isDataLoaded) {
    return (
      <div className="flex flex-col">
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
        selectedSubcategory={selectedSubcategory}
        setSelectedSubcategory={setSelectedSubcategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedAvailability={selectedAvailability}
        setSelectedAvailability={setSelectedAvailability}
        categories={categories}
        subcategories={subcategories}
        locations={locations}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 md:mb-6 gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <label className="text-xs sm:text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-36 md:w-40 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{uiNameText}</SelectItem>
              <SelectItem value="quantity">{uiQuantityText}</SelectItem>
              <SelectItem value="status">{uiStatusText}</SelectItem>
              <SelectItem value="dailyRate">{uiDailyRateText}</SelectItem>
              <SelectItem value="location">{uiLocationText}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="w-full sm:w-auto text-xs sm:text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            <span className="xs:hidden">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
          </Button>
        </div>
      </div>

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
                  <section key={categoryName} className="px-1 sm:px-2 md:px-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 pb-2 border-b border-border/70 text-primary">
                      {categoryName}
                  </h2>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:gap-4 md:gap-6">
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
                <section className="px-1 sm:px-2 md:px-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 pb-2 border-b border-border/70 text-primary flex items-center">
                        <Box className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> {uiConsumablesText}</h2>
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:gap-4 md:gap-6">
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

      {regularEquipment.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, regularEquipment.length)} of {regularEquipment.length} items
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline ml-1">{uiPreviousText}</span>
            </Button>
            <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <span className="hidden xs:inline mr-1">{uiNextText}</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      )}

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{uiConfirmDeletionText}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>{uiCancelText}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {uiDeleteText}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
