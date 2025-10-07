
"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InventoryAvailabilityView() {
  const { equipment, rentals, events, isDataLoaded } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const availabilityData = useMemo(() => {
    if (!isDataLoaded) return [];

    const dailyRentalCounts: Record<string, Record<string, number>> = {};
    rentals.forEach(rental => {
        const event = events.find(e => e.id === rental.eventId);
        if(!event) return;
        let currentDateLoop = new Date(event.startDate);
        const endDateLoop = new Date(event.endDate);
        while (currentDateLoop <= endDateLoop) {
            const dateStr = format(currentDateLoop, 'yyyy-MM-dd');
            if (!dailyRentalCounts[dateStr]) dailyRentalCounts[dateStr] = {};
            if (!dailyRentalCounts[dateStr][rental.equipmentId]) dailyRentalCounts[dateStr][rental.equipmentId] = 0;
            dailyRentalCounts[dateStr][rental.equipmentId] += rental.quantityRented;
            currentDateLoop.setDate(currentDateLoop.getDate() + 1);
        }
    });

    const filteredEquipment = equipment
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(item => selectedCategory ? item.categoryId === selectedCategory : true);

    return filteredEquipment.map(item => {
      const dailyAvailability = daysInMonth.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const rentedCount = dailyRentalCounts[dateStr]?.[item.id] || 0;
        const available = item.quantity - rentedCount;
        return {
          day,
          rentedCount,
          available,
          isOverbooked: available < 0,
        };
      });
      return { ...item, dailyAvailability };
    });
  }, [isDataLoaded, equipment, rentals, events, currentMonth, searchTerm, selectedCategory]);

  if (!isDataLoaded) {
    return <div className="text-center py-16">Loading availability data...</div>;
  }

  const { categories } = useAppContext();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Inventory Availability</CardTitle>
        <CardDescription>View equipment availability for the selected month. Overbooked days are highlighted in red.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-lg w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
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
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
        <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                <thead className="sticky top-0 bg-background z-10">
                <tr>
                    <th scope="col" className="sticky left-0 bg-background z-20 font-semibold p-2 border-b border-t w-52 min-w-52 text-left">Equipment</th>
                    {daysInMonth.map(day => (
                    <th key={day.toString()} scope="col" className={cn("font-normal p-2 border-b border-t text-center w-12", isSameDay(day, new Date()) && "bg-primary/10")}>
                        <div className="flex flex-col items-center">
                            <span className="text-xs">{format(day, 'EEE')}</span>
                            <span>{format(day, 'd')}</span>
                        </div>
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {availabilityData.map(item => (
                    <tr key={item.id}>
                    <td className="sticky left-0 bg-background z-10 p-2 border-b whitespace-nowrap font-medium text-sm w-52 min-w-52">{item.name}</td>
                    {item.dailyAvailability.map(({ day, available, rentedCount, isOverbooked }) => (
                        <Tooltip key={day.toString()}>
                        <TooltipTrigger asChild>
                            <td className={cn(
                                "p-2 border-b text-center text-sm", 
                                isOverbooked ? "bg-destructive/70 text-destructive-foreground font-bold" : "bg-green-500/20",
                                available <= 0 && !isOverbooked && "bg-yellow-500/20",
                                isSameDay(day, new Date()) && "bg-opacity-40",
                                rentedCount > 0 ? "cursor-pointer" : "cursor-default"
                            )}>
                                {available}
                            </td>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{format(day, 'PPP')}</p>
                            <p>Available: {available}</p>
                            <p>Rented: {rentedCount}</p>
                            <p>Total Stock: {item.quantity}</p>
                        </TooltipContent>
                        </Tooltip>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
