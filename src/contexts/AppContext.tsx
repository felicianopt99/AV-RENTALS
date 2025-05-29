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
    // Initialize with sample data if local storage is empty
    // This effect runs once on the client after mount.
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('av_categories') === null) {
        setCategories(sampleCategories);
      }
      if (localStorage.getItem('av_subcategories') === null) {
        setSubcategories(sampleSubcategories);
      }
      if (localStorage.getItem('av_equipment') === null) {
        setEquipment(sampleEquipment.map(e => ({...e, imageUrl: e.imageUrl || `https://placehold.co/300x200.png?text=${e.name.replace(/\s/g, "+")}` })));
      }
      // For rentals, if localStorage is empty, use sampleRentals.
      // sampleRentals now initializes Date objects from fixed strings, so they are consistent.
      if (localStorage.getItem('av_rentals') === null) {
         setRentals(sampleRentals);
      }
      // If rentals are loaded from localStorage by useLocalStorage, they will be initially set.
      // The useEffect below will handle converting string dates from localStorage to Date objects.
      setIsDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to initialize from localStorage or samples.
           // Setters from useLocalStorage are stable.

  // Ensure dates in rentals state are Date objects, especially after loading from localStorage (where they'd be strings)
  useEffect(() => {
    if (isDataLoaded) {
      setRentals(prevRentals =>
        prevRentals.map(r => {
          // Ensure startDate and endDate are Date objects
          const newStartDate = typeof r.startDate === 'string' ? new Date(r.startDate) : r.startDate;
          const newEndDate = typeof r.endDate === 'string' ? new Date(r.endDate) : r.endDate;
          
          // Defensive check in case Date objects are somehow invalid after parsing
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
  }, [isDataLoaded, setRentals]);


  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: crypto.randomUUID() }]);
  };
  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  };
  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    // Also delete associated subcategories
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
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), imageUrl: item.imageUrl || `https://placehold.co/300x200.png?text=${item.name.replace(/\s/g,"+")}` }]);
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
