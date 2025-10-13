
"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export function InventoryAvailabilityView() {
  const { equipment, rentals, events, isDataLoaded, categories } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const dailyRentalCounts = useMemo(() => {
    if (!isDataLoaded) return {};

    const counts: Record<string, Record<string, number>> = {};
    rentals.forEach(rental => {
      const event = events.find(e => e.id === rental.eventId);
      if (!event) return;
      let currentDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!counts[dateStr]) counts[dateStr] = {};
        if (!counts[dateStr][rental.equipmentId]) counts[dateStr][rental.equipmentId] = 0;
        counts[dateStr][rental.equipmentId] += rental.quantityRented;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return counts;
  }, [isDataLoaded, rentals, events]);

  const filteredEquipment = useMemo(() => {
    return equipment
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory)
      .filter(item => selectedStatus === 'all' || item.status === selectedStatus)
      .filter(item => !priceMin || item.dailyRate >= parseFloat(priceMin))
      .filter(item => !priceMax || item.dailyRate <= parseFloat(priceMax));
  }, [equipment, searchTerm, selectedCategory, selectedStatus, priceMin, priceMax]);

  const eventsForEquipment = useMemo(() => {
    if (!selectedEquipment) return [];
    const rentalsForEq = rentals.filter(r => r.equipmentId === selectedEquipment);
    return rentalsForEq.map(rental => {
      const event = events.find(e => e.id === rental.eventId);
      if (!event) return null;

      // Filter by date range if provided
      if (dateFrom && new Date(event.startDate) < new Date(dateFrom)) return null;
      if (dateTo && new Date(event.endDate) > new Date(dateTo)) return null;

      const eq = equipment.find(e => e.id === selectedEquipment);
      const isOverbooked = rental.quantityRented > (eq?.quantity || 0);
      return {
        id: rental.id,
        title: `${event.name} (${rental.quantityRented})`,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: isOverbooked ? 'hsl(var(--destructive) / 0.6)' : 'hsl(var(--primary) / 0.4)',
        borderColor: isOverbooked ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
      };
    }).filter(Boolean);
  }, [selectedEquipment, rentals, events, equipment, dateFrom, dateTo]);

  if (!isDataLoaded) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="flex flex-col lg:flex-row gap-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Inventory Availability</CardTitle>
        <CardDescription>Select an equipment item to view its rental schedule. Booked periods are shown as events. Red events indicate overbooking.</CardDescription>
          <div className="flex flex-col lg:flex-row gap-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full sm:w-[140px]"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full sm:w-[140px]"
              />
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Min Price"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full sm:w-[100px]"
                step="0.01"
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full sm:w-[100px]"
                step="0.01"
              />
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Equipment" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEquipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedEquipment ? (
            <div className="h-[600px]">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={eventsForEquipment as any}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                height="100%"
                eventDisplay="block"
              />
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Select an equipment item to view its rental schedule.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
