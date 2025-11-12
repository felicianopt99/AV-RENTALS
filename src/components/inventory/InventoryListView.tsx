"use client";

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentItem, Category, Subcategory } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { SearchSlash, Download, ArrowUpDown, Edit, Trash2, Eye, Package, MapPin, DollarSign, Hash, CheckCircle, XCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslate } from '@/contexts/TranslationContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  // Translation hooks
  const { translated: uiCancelText } = useTranslate('Cancel');
  const { translated: uiConfirmDeletionText } = useTranslate('Confirm Deletion');
  const { translated: uiNextText } = useTranslate('Next');
  const { translated: uiPreviousText } = useTranslate('Previous');
  const { translated: uiActionsText } = useTranslate('Actions');
  const { translated: uiAvailabilityText } = useTranslate('Availability');
  const { translated: uiQtyText } = useTranslate('Qty');
  const { translated: uiCategoryText } = useTranslate('Category');
  const { translated: uiDetailsText } = useTranslate('Details');
  const { translated: uiEquipmentText } = useTranslate('Equipment');
  const { translated: uiExportCSVText } = useTranslate('Export CSV');
  const { translated: uiLocationText } = useTranslate('Location');
  const { translated: uiDailyRateText } = useTranslate('Daily Rate');
  const { translated: uiStatusText } = useTranslate('Status');
  const { translated: uiQuantityText } = useTranslate('Quantity');
  const { translated: uiNameText } = useTranslate('Name');
  const { translated: uiDeleteText } = useTranslate('Delete');
  const { translated: uiEditText } = useTranslate('Edit');
  const { translated: uiViewText } = useTranslate('View');
  const { translated: toastItemDeletedTitleText } = useTranslate('Item Deleted');

  const { equipment, categories, subcategories, rentals, events, isDataLoaded } = useAppContext();
  const { deleteEquipmentItem } = useAppDispatch();
  const router = useRouter();
  const isMobile = useIsMobile();

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
  const itemsPerPage = isMobile ? 8 : 10;
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
      toast({ title: "{toastItemDeletedTitleText}", description: `"${itemToDelete.name}" has been removed.` });
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteEquipmentItem, toast]);

  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'good':
        return {
          color: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400',
          icon: CheckCircle,
          label: 'Good'
        };
      case 'damaged':
        return {
          color: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400',
          icon: XCircle,
          label: 'Damaged'
        };
      case 'maintenance':
        return {
          color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
          icon: AlertCircle,
          label: 'Maintenance'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-700 border-gray-500/30 dark:text-gray-400',
          icon: AlertCircle,
          label: status
        };
    }
  }, []);

  const getAvailabilityConfig = useCallback((isRented: boolean) => {
    return isRented
      ? {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          label: 'Rented'
        }
      : {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          label: 'Available'
        };
  }, []);

  if (!isDataLoaded) {
    return (
      <div className="flex flex-col">
        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <p className="text-lg text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  const noItemsFound = filteredEquipment.length === 0;

  const renderEquipmentCard = (item: EquipmentItem) => {
    const category = categories.find(c => c.id === item.categoryId);
    const subcategory = subcategories.find(s => s.id === item.subcategoryId);
    const isRented = isCurrentlyRented(item.id);
    const statusConfig = getStatusConfig(item.status);
    const availabilityConfig = getAvailabilityConfig(isRented);
    const StatusIcon = statusConfig.icon;

    return (
      <Card key={item.id} className="p-3 hover:bg-muted/30 transition-colors border-0 shadow-none bg-background/50 rounded-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{item.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{category?.name || 'Uncategorized'}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{item.location}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/equipment/${item.id}`)}>
                <Eye className="mr-2 h-3 w-3" />
                {uiViewText}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/equipment/${item.id}/edit`)}>
                <Edit className="mr-2 h-3 w-3" />
                {uiEditText}</DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openDeleteConfirmDialog(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                {uiDeleteText}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Qty: {item.quantity}</span>
            <span>•</span>
            <span>${item.dailyRate.toFixed(2)}/day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color.includes('green') ? 'bg-green-500' : statusConfig.color.includes('red') ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-muted-foreground">{availabilityConfig.label}</span>
          </div>
        </div>
      </Card>
    );
  };

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-40">
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
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="w-full sm:w-auto">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          {uiExportCSVText}</Button>
      </div>

      {noItemsFound ? (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
          <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
          <p className="text-xl mb-1">No items found.</p>
          <p className="text-sm">Try adjusting your filters or adding new equipment.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          {isMobile ? (
            <div className="grid gap-4">
              {paginatedEquipment.map(renderEquipmentCard)}
            </div>
          ) : (
            /* Desktop Table Layout */
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[180px] font-semibold">{uiEquipmentText}</TableHead>
                    <TableHead className="min-w-[200px] font-semibold">{uiDetailsText}</TableHead>
                    <TableHead className="min-w-[120px] font-semibold">{uiCategoryText}</TableHead>
                    <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                    <TableHead className="min-w-[100px] font-semibold">Location</TableHead>
                    <TableHead className="min-w-[80px] font-semibold">{uiQtyText}</TableHead>
                    <TableHead className="min-w-[100px] font-semibold">Rate/Day</TableHead>
                    <TableHead className="min-w-[100px] font-semibold">{uiAvailabilityText}</TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-center">{uiActionsText}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEquipment.map((item) => {
                    const category = categories.find(c => c.id === item.categoryId);
                    const subcategory = subcategories.find(s => s.id === item.subcategoryId);
                    const isRented = isCurrentlyRented(item.id);
                    const statusConfig = getStatusConfig(item.status);
                    const availabilityConfig = getAvailabilityConfig(isRented);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={item.imageUrl} alt={item.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <Package className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm truncate" title={item.description}>
                              {item.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {category?.name || 'Uncategorized'}
                            </Badge>
                            {subcategory && (
                              <Badge variant="secondary" className="text-xs block w-fit">
                                {subcategory.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} border flex items-center space-x-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusConfig.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{item.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm font-medium">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span>{item.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span>{item.dailyRate.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={availabilityConfig.color}>
                            {availabilityConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <Button 
                              variant="accentGhost" 
                              size="icon" 
                              onClick={() => router.push(`/equipment/${item.id}`)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="accentGhost" 
                              size="icon" 
                              onClick={() => router.push(`/equipment/${item.id}/edit`)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openDeleteConfirmDialog(item)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEquipment.length)} of {filteredEquipment.length} items
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto"
              >
                {uiPreviousText}</Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto"
              >
                {uiNextText}</Button>
            </div>
          </div>
        </>
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
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
