
"use client";

import { useState, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category, Subcategory } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, ListTree, HelpCircle, FolderPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription as FormFieldDescription } from '@/components/ui/form'; // Renamed FormDescription to avoid conflict
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CategoryIconMapper } from '@/components/icons/CategoryIconMapper';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const NO_ICON_VALUE = "__no-icon__";

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.'),
  icon: z.string().optional(),
});
type CategoryFormData = z.infer<typeof categorySchema>;

const subcategorySchema = z.object({
  name: z.string().min(2, 'Subcategory name must be at least 2 characters.'),
  parentId: z.string().min(1, 'Parent category is required.'),
});
type SubcategoryFormData = z.infer<typeof subcategorySchema>;

const availableIcons = ['Mic', 'Videotape', 'Zap', 'Cuboid', 'Speaker', 'Camera', 'Projector', 'Lightbulb', 'Drum', 'Cable', 'Settings', 'Layers', 'ListTree'];

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
  subcategories: Subcategory[];
  onEditSubcategory: (sub: Subcategory) => void;
  onDeleteSubcategory: (sub: Subcategory) => void;
}

function SortableCategoryItem({ category, onEdit, onDelete, onAddSubcategory, subcategories, onEditSubcategory, onDeleteSubcategory }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`shadow-md transition-all duration-300 hover:shadow-lg group ${isDragging ? 'opacity-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <div {...attributes} {...listeners} className="cursor-grab mr-2">
            <ListTree className="h-5 w-5 text-muted-foreground" />
          </div>
          <CategoryIconMapper iconName={category.icon} className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-lg">{category.name}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>Subcategories:</CardDescription>
        {subcategories.filter(sub => sub.parentId === category.id).length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {subcategories.filter(sub => sub.parentId === category.id).map(sub => (
              <div key={sub.id} className="group flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm transition-all duration-200 hover:bg-muted/80">
                <Badge variant="secondary" className="px-2">{sub.name}</Badge>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEditSubcategory(sub)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteSubcategory(sub)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">No subcategories yet.</p>
        )}
      </CardContent>
      <CardFooter>
         <Button variant="outline" size="sm" onClick={() => onAddSubcategory(category.id)}>
          <PlusCircle className="mr-1 h-3 w-3" /> Add Subcategory
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CategoryManager() {
  const { categories, subcategories } = useAppContext();
  const { addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory } = useAppDispatch();
  const { toast } = useToast();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);

  useEffect(() => {
    setOrderedCategories(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: NO_ICON_VALUE,
    }
  });
  const subcategoryForm = useForm<SubcategoryFormData>({ resolver: zodResolver(subcategorySchema) });

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: '', icon: NO_ICON_VALUE });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({ name: category.name, icon: category.icon || NO_ICON_VALUE });
    setIsCategoryDialogOpen(true);
  };

  const handleCategorySubmit = (data: CategoryFormData) => {
    const finalIconValue = data.icon === NO_ICON_VALUE ? '' : data.icon;
    const categoryData = { name: data.name, icon: finalIconValue };

    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryData });
      toast({ title: 'Category Updated', description: `Category "${data.name}" updated.` });
    } else {
      addCategory(categoryData);
      toast({ title: 'Category Added', description: `Category "${data.name}" added.` });
    }
    setIsCategoryDialogOpen(false);
  };

  const openCategoryDeleteDialog = useCallback((category: Category) => {
    setCategoryToDelete(category);
  }, []);

  const confirmDeleteCategory = useCallback(() => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      toast({ title: 'Category Deleted', description: `"${categoryToDelete.name}" and its subcategories deleted.` });
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, deleteCategory, toast]);

  const handleAddSubcategory = (parentCategoryId?: string) => {
    setEditingSubcategory(null);
    subcategoryForm.reset({ name: '', parentId: parentCategoryId || '' });
    setIsSubcategoryDialogOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    subcategoryForm.reset({ name: subcategory.name, parentId: subcategory.parentId });
    setIsSubcategoryDialogOpen(true);
  };

  const handleSubcategorySubmit = (data: SubcategoryFormData) => {
    if (editingSubcategory) {
      updateSubcategory({ ...editingSubcategory, ...data });
      toast({ title: 'Subcategory Updated', description: `Subcategory "${data.name}" updated.` });
    } else {
      addSubcategory(data);
      toast({ title: 'Subcategory Added', description: `Subcategory "${data.name}" added.` });
    }
    setIsSubcategoryDialogOpen(false);
  };

  const openSubcategoryDeleteDialog = useCallback((subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
  }, []);

  const confirmDeleteSubcategory = useCallback(() => {
    if (subcategoryToDelete) {
      deleteSubcategory(subcategoryToDelete.id);
      toast({ title: 'Subcategory Deleted', description: `"${subcategoryToDelete.name}" deleted.` });
      setSubcategoryToDelete(null);
    }
  }, [subcategoryToDelete, deleteSubcategory, toast]);


  const filteredCategories = orderedCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-semibold">Categories</h2>
        <Button onClick={handleAddCategory} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
      <div className="mb-4">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <ScrollArea className="min-h-[400px] max-h-[calc(100vh-200px)] md:min-h-[500px]">
        <div className="space-y-4 pr-4">
        {filteredCategories.length === 0 ? (
          searchTerm ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg mb-2">No categories found</p>
              <p className="text-sm">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
              <FolderPlus className="w-16 h-16 mb-4 text-primary/50" />
              <p className="text-xl mb-1">No categories created yet.</p>
              <p className="text-sm mb-4">Click "Add Category" to start organizing your equipment.</p>
              <Button onClick={handleAddCategory} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Category
              </Button>
            </div>
          )
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredCategories.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
              {filteredCategories.map(category => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={openCategoryDeleteDialog}
                  onAddSubcategory={handleAddSubcategory}
                  subcategories={subcategories}
                  onEditSubcategory={handleEditSubcategory}
                  onDeleteSubcategory={openSubcategoryDeleteDialog}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        </div>
      </ScrollArea>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4 py-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_ICON_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_ICON_VALUE}>
                           <div className="flex items-center">
                            <HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                            No Icon
                          </div>
                        </SelectItem>
                        {availableIcons.map(iconName => (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center">
                              <CategoryIconMapper iconName={iconName} className="h-4 w-4 mr-2" />
                              {iconName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormFieldDescription>Select a visual icon for the category.</FormFieldDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingCategory ? 'Save Changes' : 'Add Category'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? 'Edit' : 'Add'} Subcategory</DialogTitle>
          </DialogHeader>
          <Form {...subcategoryForm}>
            <form onSubmit={subcategoryForm.handleSubmit(handleSubcategorySubmit)} className="space-y-4 py-4">
              <FormField
                control={subcategoryForm.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subcategoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                 <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingSubcategory ? 'Save Changes' : 'Add Subcategory'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      {categoryToDelete && (
        <AlertDialog open={!!categoryToDelete} onOpenChange={(isOpen) => !isOpen && setCategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Category Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the category "{categoryToDelete.name}"? 
                This will also delete all its subcategories. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive hover:bg-destructive/90">
                Delete Category
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Subcategory Confirmation Dialog */}
      {subcategoryToDelete && (
        <AlertDialog open={!!subcategoryToDelete} onOpenChange={(isOpen) => !isOpen && setSubcategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Subcategory Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the subcategory "{subcategoryToDelete.name}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSubcategoryToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSubcategory} className="bg-destructive hover:bg-destructive/90">
                Delete Subcategory
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    