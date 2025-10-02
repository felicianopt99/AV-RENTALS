
"use client";

import { useState } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import type { EquipmentItem, Category, Subcategory } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Pencil, Trash2, QrCode } from 'lucide-react';
import { CategoryIconMapper } from '@/components/icons/CategoryIconMapper';
import { useAppContext } from '@/contexts/AppContext';

interface EquipmentCardProps {
  item: EquipmentItem;
  category?: Category;
  subcategory?: Subcategory;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (itemId: string) => void;
}

export function EquipmentCard({ item, category, subcategory, onEdit, onDelete }: EquipmentCardProps) {
  const { categories } = useAppContext();
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);
  const itemCategory = category || categories.find(c => c.id === item.categoryId);

  const getStatusColor = (status: EquipmentItem['status']) => {
    switch (status) {
      case 'good':
        return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'; 
      case 'damaged':
        return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
    }
  }
  
  const qrCodeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/equipment/${item.id}/edit`
    : '';

  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card border border-border/50 rounded-lg">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[16/10] rounded-t-lg overflow-hidden">
            <Image 
              src={item.imageUrl || `https://placehold.co/600x400.png`} 
              alt={item.name} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint="equipment audiovisual"
            />
          </div>
        </CardHeader>
        <CardContent className="p-5 flex-grow flex flex-col">
          <div className="mb-2">
            <CardTitle className="text-xl font-semibold line-clamp-2">{item.name}</CardTitle>
            {itemCategory && (
              <div className="flex items-center text-xs text-muted-foreground mt-1.5">
                <CategoryIconMapper iconName={itemCategory.icon} className="w-3.5 h-3.5 mr-1.5" />
                <span className="truncate">{itemCategory.name} {subcategory ? `> ${subcategory.name}` : ''}</span>
              </div>
            )}
          </div>
          <CardDescription className="text-sm text-muted-foreground mb-3 flex-grow max-h-20 overflow-y-auto scrollbar-thin">
            {item.description}
          </CardDescription>
          <div className="space-y-1.5 text-xs text-muted-foreground/80 mt-auto">
            <p><span className="font-medium">Location:</span> {item.location}</p>
            <p><span className="font-medium">Available:</span> {item.quantity}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t border-border/50">
          <Badge variant="outline" className={`py-1 px-2.5 text-xs ${getStatusColor(item.status)}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsQrCodeOpen(true)} aria-label="Show QR code" className="text-muted-foreground hover:text-primary">
                <QrCode className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} aria-label="Edit item" className="text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} aria-label="Delete item" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {item.name}</DialogTitle>
            <DialogDescription>
              Scan this code to quickly access the equipment details page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-white rounded-lg">
            {qrCodeUrl && <QRCode value={qrCodeUrl} size={256} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
