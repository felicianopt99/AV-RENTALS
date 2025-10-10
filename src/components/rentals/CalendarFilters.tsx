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
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg shadow-sm">
      <div className="flex-1 flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search rentals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Search
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
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
        </div>
        <div className="flex items-center space-x-2">
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-40">
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
        </div>
        <div className="flex items-center space-x-2">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-32">
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
        <Button variant="outline" size="sm" onClick={handleFilterChange}>
          Filter
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
