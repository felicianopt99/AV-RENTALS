
"use client";

import { useState, useMemo, useCallback, useRef, createRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentLabel } from './EquipmentLabel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Search } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import * as htmlToImage from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

export function InventoryLabelGenerator() {
  const { equipment, isDataLoaded } = useAppContext();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [companyName, setCompanyName] = useState(APP_NAME);
  const [isDownloading, setIsDownloading] = useState(false);

  // Create refs for each item to convert to image
  const labelRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});

  const filteredEquipment = useMemo(() => 
    equipment.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [equipment, searchTerm]
  );
  
  // Ensure refs are created for all filtered equipment
  filteredEquipment.forEach(item => {
    if (!labelRefs.current[item.id]) {
      labelRefs.current[item.id] = createRef<HTMLDivElement>();
    }
  });


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEquipment.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    toast({ title: "Starting Download...", description: `Preparing ${selectedIds.size} labels.` });

    for (const id of Array.from(selectedIds)) {
      const itemRef = labelRefs.current[id]?.current;
      const item = equipment.find(e => e.id === id);

      if (!itemRef || !item) continue;

      try {
        const dataUrl = await htmlToImage.toJpeg(itemRef, { quality: 0.95 });
        const link = document.createElement('a');
        link.download = `${item.name.replace(/ /g, '_')}_label.jpg`;
        link.href = dataUrl;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between downloads
      } catch (error) {
        console.error('oops, something went wrong!', error);
        toast({ variant: "destructive", title: `Failed to generate label for ${item.name}` });
      }
    }

    setIsDownloading(false);
    toast({ title: "Download Complete", description: `Finished downloading all selected labels.` });
  }, [selectedIds, equipment, toast]);

  if (!isDataLoaded) {
    return <p className="text-muted-foreground">Loading equipment...</p>;
  }

  const selectedEquipmentForRender = equipment.filter(item => selectedIds.has(item.id));

  return (
    <div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inventory Label Generator</CardTitle>
            <CardDescription>Select equipment and customize info to download JPG labels with QR codes.</CardDescription>
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
              <Button onClick={handleDownload} disabled={selectedIds.size === 0 || isDownloading} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? `Downloading...` : `Download ${selectedIds.size} JPGs`}
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

      {/* Hidden container for rendering labels off-screen before download */}
      <div className="absolute -left-[9999px] top-0">
        {selectedEquipmentForRender.map(item => (
          <EquipmentLabel 
            key={`render-${item.id}`} 
            ref={labelRefs.current[item.id]} 
            item={item} 
            companyName={companyName} 
          />
        ))}
      </div>
    </div>
  );
}
