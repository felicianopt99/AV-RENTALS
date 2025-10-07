
"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentLabel } from './EquipmentLabel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

export function InventoryLabelGenerator() {
  const { equipment, isDataLoaded } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [companyName, setCompanyName] = useState(APP_NAME);
  const [isPrinting, setIsPrinting] = useState(false);

  const filteredEquipment = useMemo(() => 
    equipment.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [equipment, searchTerm]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEquipment.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100); // Small timeout to allow state to update and UI to re-render before printing
  };

  if (!isDataLoaded) {
    return <p className="text-muted-foreground">Loading equipment...</p>;
  }

  const selectedEquipment = equipment.filter(item => selectedIds.has(item.id));

  return (
    <div className={cn({ 'printable-area': isPrinting })}>
      <div className="no-print">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inventory Label Generator</CardTitle>
            <CardDescription>Select equipment and customize info to generate printable labels with QR codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="company-name">Company Name for Labels</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              <Button onClick={handlePrint} disabled={selectedIds.size === 0} className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Print {selectedIds.size} Selected Labels
              </Button>
            </div>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                 <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all"
                        checked={selectedIds.size === filteredEquipment.length && filteredEquipment.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium">
                      Select All ({selectedIds.size} / {filteredEquipment.length})
                    </Label>
                 </div>
                 <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    />
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  <div className="p-4 space-y-2">
                    {filteredEquipment.map(item => (
                      <div key={item.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev => {
                              const newSet = new Set(prev);
                              if (checked) {
                                newSet.add(item.id);
                              } else {
                                newSet.delete(item.id);
                              }
                              return newSet;
                            });
                          }}
                        />
                        <Label htmlFor={`item-${item.id}`} className="flex-grow font-normal cursor-pointer">
                          {item.name}
                        </Label>
                      </div>
                    ))}
                     {filteredEquipment.length === 0 && (
                        <p className="text-center text-muted-foreground p-4">No equipment found.</p>
                     )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </CardContent>
        </Card>
      </div>

      {isPrinting && (
        <div>
           <div className="grid grid-cols-3 gap-2">
            {selectedEquipment.map(item => (
              <EquipmentLabel key={item.id} item={item} companyName={companyName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
