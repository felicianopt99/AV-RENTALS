"use client";

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentItem, Category, Subcategory } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { SearchSlash, Download, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
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

export function InventoryListView() {
  const { equipment, categories, subcategories, rentals, events, isDataLoaded } = useAppContext();
  const { deleteEquipmentItem } = useAppDispatch();
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
  const itemsPerPage = 10;
  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);

  const { toast } = useToast();

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

  const filteredEquipment = useMemo(() => {
    return equipment
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
  }, [equipment, searchTerm, selectedCategory, selectedSubcategory, selectedStatus, selectedLocation, selectedType, selectedAvailability, isCurrentlyRented]);

  const sortedEquipment = useMemo(() => {
    return [...filteredEquipment].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'status':
          aValue = EQUIPMENT_STATUSES.find(s => s.value === a.status)?.label || a.status;
          bValue = EQUIPMENT_STATUSES.find(s => s.value === b.status)?.label || b.status;
          break;
        case 'dailyRate':
          aValue = a.dailyRate;
          bValue = b.dailyRate;
          break;
        case 'location':
          aValue = a.location;
          bValue = b.location;
          break;
        default:
          return 0;
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
  }, [filteredEquipment, sortBy, sortOrder]);

  const paginatedEquipment = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEquipment.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEquipment, currentPage]);

  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);

  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Description', 'Category', 'Subcategory', 'Status', 'Location', 'Quantity', 'Daily Rate', 'Type', 'Availability'];
    const rows = filteredEquipment.map(item => {
      const category = categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized';
      const subcategory = subcategories.find(s => s.id === item.subcategoryId)?.name || '';
      const availability = isCurrentlyRented(item.id) ? 'Rented' : 'Available';
      return [
        item.name,
        item.description,
        category,
        subcategory,
        item.status,
        item.location,
        item.quantity,
        item.dailyRate,
        item.type,
        availability
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredEquipment, categories, subcategories, isCurrentlyRented]);

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

  const noItemsFound = filteredEquipment.length === 0;

  return (
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="dailyRate">Daily Rate</SelectItem>
              <SelectItem value="location">Location</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {noItemsFound ? (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
          <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
          <p className="text-xl mb-1">No items found.</p>
          <p className="text-sm">Try adjusting your filters or adding new equipment.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEquipment.map((item) => {
                  const category = categories.find(c => c.id === item.categoryId);
                  const subcategory = subcategories.find(s => s.id === item.subcategoryId);
                  const availability = isCurrentlyRented(item.id) ? 'Rented' : 'Available';
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>{subcategory?.name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'good' ? 'bg-green-100 text-green-800' :
                          item.status === 'damaged' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.dailyRate.toFixed(2)}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{availability}</TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/equipment/${item.id}/edit`)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(item)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEquipment.length)} of {filteredEquipment.length} items
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
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
    </div>
  );
}
