
"use client";

import { useState, useCallback } from 'react';
import type { Category, Subcategory } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
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
import { PlusCircle, Edit, Trash2, ListTree, HelpCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CategoryIconMapper } from '@/components/icons/CategoryIconMapper';
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


export function CategoryManager() {
  const { categories, subcategories, addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory } = useAppContext();
  const { toast } = useToast();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);

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


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Categories</h2>
        <Button onClick={handleAddCategory}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]"> {/* Adjust height as needed */}
        <div className="space-y-4 pr-4">
        {categories.map(category => (
          <Card key={category.id} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center">
                <CategoryIconMapper iconName={category.icon} className="h-5 w-5 mr-2 text-primary" />
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openCategoryDeleteDialog(category)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Subcategories:</CardDescription>
              {subcategories.filter(sub => sub.parentId === category.id).length > 0 ? (
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                  {subcategories.filter(sub => sub.parentId === category.id).map(sub => (
                    <li key={sub.id} className="flex justify-between items-center group">
                      <span>{sub.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSubcategory(sub)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openSubcategoryDeleteDialog(sub)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No subcategories yet.</p>
              )}
            </CardContent>
            <CardFooter>
               <Button variant="outline" size="sm" onClick={() => handleAddSubcategory(category.id)}>
                <PlusCircle className="mr-1 h-3 w-3" /> Add Subcategory
              </Button>
            </CardFooter>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-muted-foreground">No categories created yet. Click "Add Category" to start.</p>}
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormDescription>Select a visual icon for the category.</FormDescription>
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
