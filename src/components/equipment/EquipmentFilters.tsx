"use client";

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { Category, Subcategory } from '@/types';
import { EQUIPMENT_STATUSES } from '@/lib/constants';

interface EquipmentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategoryId: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (availability: string) => void;
  categories: Category[];
  subcategories: Subcategory[];
  locations: string[];
}

export function EquipmentFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedStatus,
  setSelectedStatus,
  selectedLocation,
  setSelectedLocation,
  selectedType,
  setSelectedType,
  selectedAvailability,
  setSelectedAvailability,
  categories,
  subcategories,
  locations,
}: EquipmentFiltersProps) {

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedStatus('');
    setSelectedLocation('');
    setSelectedType('');
    setSelectedAvailability('');
  };

  const filteredSubcategories = subcategories.filter(sub =>
    !selectedCategory || sub.parentId === selectedCategory
  );

  return (
    <div className="mb-4 md:mb-8 p-3 md:p-6 bg-card rounded-xl shadow-lg border border-border/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-3 md:gap-y-4 items-end">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1.5">Search Equipment</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="search"
              type="text"
              placeholder="e.g., SM58, Projector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 h-11"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1.5">Category</label>
          <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setSelectedSubcategory(''); }}>
            <SelectTrigger id="category" className="h-11">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-muted-foreground mb-1.5">Subcategory</label>
          <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={!selectedCategory}>
            <SelectTrigger id="subcategory" className="h-11">
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status" className="h-11">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1.5">Location</label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger id="location" className="h-11">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1.5">Type</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger id="type" className="h-11">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="consumable">Consumable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-muted-foreground mb-1.5">Availability</label>
          <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
            <SelectTrigger id="availability" className="h-11">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={clearFilters} variant="outline" className="w-full h-11 text-base font-medium">
          <X className="mr-2 h-4 w-4" /> Clear Filters
        </Button>
      </div>
    </div>
  );
}
