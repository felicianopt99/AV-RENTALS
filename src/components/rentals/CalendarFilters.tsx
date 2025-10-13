"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface CalendarFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { equipment?: string; client?: string; category?: string }) => void;
  onClearFilters: () => void;
}

export function CalendarFilters({
  onSearch,
  onFilterChange,
  onClearFilters,
}: CalendarFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { equipment, clients, categories } = useAppContext();

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = () => {
    onFilterChange({
      equipment: equipmentFilter,
      client: clientFilter,
      category: categoryFilter,
    });
  };

  const handleClear = () => {
    setSearchQuery('');
    setEquipmentFilter('');
    setClientFilter('');
    setCategoryFilter('');
    onSearch('');
    onFilterChange({});
    onClearFilters();
  };

  return (
    <div className="flex flex-col gap-3 p-3 md:p-4 bg-card/50 rounded-xl border border-border/30 backdrop-blur-sm">
      {/* Search Section */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex-1 flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search rentals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border-border/40 bg-background/50"
          />
          <Button variant="default" size="sm" onClick={handleSearch} className="flex-shrink-0">
            Search
          </Button>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full border-border/40 bg-background/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-full border-border/40 bg-background/50">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full border-border/40 bg-background/50">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 sm:flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleFilterChange} className="flex-1 sm:flex-initial">
            Filter
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
