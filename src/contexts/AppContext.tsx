
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Category, Subcategory, EquipmentItem, Rental } from '@/types';
import { sampleCategories, sampleSubcategories, sampleEquipment, sampleRentals } from '@/lib/sample-data';
import useLocalStorage from '@/hooks/useLocalStorage';

interface AppContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  subcategories: Subcategory[];
  setSubcategories: React.Dispatch<React.SetStateAction<Subcategory[]>>;
  addSubcategory: (subcategory: Omit<Subcategory, 'id'>) => void;
  updateSubcategory: (subcategory: Subcategory) => void;
  deleteSubcategory: (subcategoryId: string) => void;

  equipment: EquipmentItem[];
  setEquipment: React.Dispatch<React.SetStateAction<EquipmentItem[]>>;
  addEquipmentItem: (item: Omit<EquipmentItem, 'id'>) => void;
  updateEquipmentItem: (item: EquipmentItem) => void;
  deleteEquipmentItem: (itemId: string) => void;

  rentals: Rental[];
  setRentals: React.Dispatch<React.SetStateAction<Rental[]>>;
  addRental: (rental: Omit<Rental, 'id'>) => void;
  updateRental: (rental: Rental) => void;
  deleteRental: (rentalId: string) => void;
  
  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useLocalStorage<Category[]>('av_categories', []);
  const [subcategories, setSubcategories] = useLocalStorage<Subcategory[]>('av_subcategories', []);
  const [equipment, setEquipment] = useLocalStorage<EquipmentItem[]>('av_equipment', []);
  const [rentals, setRentals] = useLocalStorage<Rental[]>('av_rentals', []);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // This effect runs once on the client after mount.
    // useLocalStorage hook initializes with initialValue, then loads from localStorage in its own effect.
    // This effect then checks if localStorage was indeed empty to set sample data.
    if (typeof window !== 'undefined') {
      const categoriesExist = localStorage.getItem('av_categories');
      const subcategoriesExist = localStorage.getItem('av_subcategories');
      const equipmentExist = localStorage.getItem('av_equipment');
      const rentalsExist = localStorage.getItem('av_rentals');

      if (categoriesExist === null) {
        setCategories(sampleCategories);
      }
      if (subcategoriesExist === null) {
        setSubcategories(sampleSubcategories);
      }
      if (equipmentExist === null) {
        // Use 600x400 as a consistent placeholder size if not specified, without text query.
        setEquipment(sampleEquipment.map(e => ({...e, imageUrl: e.imageUrl || `https://placehold.co/600x400.png` })));
      }
      if (rentalsExist === null) {
         setRentals(sampleRentals); // sampleRentals provides Date objects
      }
      setIsDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to initialize from localStorage or samples.

  // Ensure dates in rentals state are Date objects, especially after loading from localStorage (where they'd be strings)
  useEffect(() => {
    if (isDataLoaded) { // Only process if data loading step (including localStorage hydration) is complete
      setRentals(prevRentals =>
        prevRentals.map(r => {
          const newStartDate = typeof r.startDate === 'string' ? new Date(r.startDate) : r.startDate;
          const newEndDate = typeof r.endDate === 'string' ? new Date(r.endDate) : r.endDate;
          
          const finalStartDate = newStartDate instanceof Date && !isNaN(newStartDate.getTime()) ? newStartDate : new Date();
          const finalEndDate = newEndDate instanceof Date && !isNaN(newEndDate.getTime()) ? newEndDate : new Date();

          return {
            ...r,
            startDate: finalStartDate,
            endDate: finalEndDate,
          };
        })
      );
    }
  }, [isDataLoaded, setRentals]); // Include setRentals as it's an external function


  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: crypto.randomUUID() }]);
  };
  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  };
  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setSubcategories(prev => prev.filter(subcat => subcat.parentId !== categoryId));
  };

  const addSubcategory = (subcategory: Omit<Subcategory, 'id'>) => {
    setSubcategories(prev => [...prev, { ...subcategory, id: crypto.randomUUID() }]);
  };
  const updateSubcategory = (updatedSubcategory: Subcategory) => {
    setSubcategories(prev => prev.map(sub => sub.id === updatedSubcategory.id ? updatedSubcategory : sub));
  };
  const deleteSubcategory = (subcategoryId: string) => {
    setSubcategories(prev => prev.filter(sub => sub.id !== subcategoryId));
  };
  
  const addEquipmentItem = (item: Omit<EquipmentItem, 'id'>) => {
    // Use 600x400 as a consistent placeholder size if not specified, without text query.
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), imageUrl: item.imageUrl || `https://placehold.co/600x400.png` }]);
  };
  const updateEquipmentItem = (updatedItem: EquipmentItem) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedItem.id ? updatedItem : eq));
  };
  const deleteEquipmentItem = (itemId: string) => {
    setEquipment(prev => prev.filter(eq => eq.id !== itemId));
  };

  const addRental = (rental: Omit<Rental, 'id'>) => {
    setRentals(prev => [...prev, { ...rental, id: crypto.randomUUID() }]);
  };
  const updateRental = (updatedRental: Rental) => {
    setRentals(prev => prev.map(r => r.id === updatedRental.id ? updatedRental : r));
  };
  const deleteRental = (rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
  };

  return (
    <AppContext.Provider value={{
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      subcategories, setSubcategories, addSubcategory, updateSubcategory, deleteSubcategory,
      equipment, setEquipment, addEquipmentItem, updateEquipmentItem, deleteEquipmentItem,
      rentals, setRentals, addRental, updateRental, deleteRental,
      isDataLoaded
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
