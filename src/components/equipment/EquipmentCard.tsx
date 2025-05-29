"use client";

import Image from 'next/image';
import type { EquipmentItem, Category, Subcategory } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
  const itemCategory = category || categories.find(c => c.id === item.categoryId);

  const getStatusVariant = (status: EquipmentItem['status']) => {
    switch (status) {
      case 'good':
        return 'default'; // Consider a success variant if available or custom
      case 'damaged':
        return 'destructive';
      case 'maintenance':
        return 'secondary'; // Consider a warning variant
      default:
        return 'outline';
    }
  };
  
  const getStatusColor = (status: EquipmentItem['status']) => {
    switch (status) {
      case 'good':
        return 'bg-green-500/20 text-green-400 border-green-500/30'; 
      case 'damaged':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }


  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="relative w-full h-48 rounded-md overflow-hidden mb-2">
          <Image 
            src={item.imageUrl || `https://placehold.co/300x200.png`} 
            alt={item.name} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="equipment audiovisual"
          />
        </div>
        <CardTitle className="text-lg">{item.name}</CardTitle>
        {itemCategory && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <CategoryIconMapper iconName={itemCategory.icon} className="w-4 h-4 mr-1.5" />
            <span>{itemCategory.name} {subcategory ? `> ${subcategory.name}` : ''}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardDescription className="text-sm mb-2 h-16 overflow-y-auto">{item.description}</CardDescription>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Location: {item.location}</p>
          <p>Available: {item.quantity}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
         <Badge variant="outline" className={getStatusColor(item.status)}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)} aria-label="Edit item">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label="Delete item">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
