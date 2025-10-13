
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
      <Card
        className={
          "group flex flex-col overflow-hidden h-full rounded-lg sm:rounded-2xl md:rounded-3xl border border-border/40 bg-card/80 card-gradient glass-card transition-all duration-300 ease-out " +
          "hover:shadow-2xl hover:shadow-primary/10 active:scale-[0.99]"
        }
        aria-label={item.name}
      >
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            <Image
              src={item.imageUrl || `https://placehold.co/600x400.png`}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain"
              data-ai-hint="equipment audiovisual"
            />
            {/* top overlay for status */}
            <div className="absolute left-2 top-2">
              <Badge
                variant="outline"
                className={"px-2 py-0.5 text-[10px] sm:text-xs rounded-full " + getStatusColor(item.status)}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </div>
            {/* bottom overlay for price per day when applicable */}
            {item.dailyRate > 0 && (
              <div className="absolute right-2 bottom-2">
                <div className="rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[10px] sm:text-xs border border-border/50">
                  €{item.dailyRate.toFixed(2)} / day
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-5 flex-grow flex flex-col">
          <div className="mb-1.5 sm:mb-2">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold leading-tight line-clamp-2">
              {item.name}
            </CardTitle>
            {itemCategory && (
              <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground mt-1">
                <CategoryIconMapper iconName={itemCategory.icon} className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span className="truncate">{itemCategory.name} {subcategory ? `> ${subcategory.name}` : ''}</span>
              </div>
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground/90 mb-2 sm:mb-3 flex-grow line-clamp-3 sm:line-clamp-4">
            {item.description}
          </CardDescription>
          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs text-muted-foreground/80 mt-auto">
            <div className="truncate"><span className="font-medium text-foreground/80">Location:</span> {item.location}</div>
            <div className="text-right"><span className="font-medium text-foreground/80">Available:</span> {item.quantity}</div>
          </div>
        </CardContent>
        <CardFooter className="p-2.5 sm:p-3 md:p-4 flex justify-end items-center gap-0.5 sm:gap-1 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsQrCodeOpen(true)}
            aria-label="Show QR code"
            className="text-muted-foreground hover:text-primary h-7 w-7 sm:h-8 sm:w-8 p-0"
            title="Show QR code"
          >
            <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            aria-label="Edit item"
            className="text-muted-foreground hover:text-primary h-7 w-7 sm:h-8 sm:w-8 p-0"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            aria-label="Delete item"
            className="text-muted-foreground hover:text-destructive h-7 w-7 sm:h-8 sm:w-8 p-0"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
        <DialogContent className="sm:max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{item.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Scan this code to quickly access the equipment details page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-3 sm:p-4 bg-card rounded-lg border border-border/40">
            {qrCodeUrl && <QRCode value={qrCodeUrl} size={200} className="w-full max-w-[256px] h-auto" />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
