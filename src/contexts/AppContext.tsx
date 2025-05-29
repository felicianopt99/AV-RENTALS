
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
    const populateSampleDataIfNeeded = () => {
      if (typeof window === 'undefined') return;

      const wasKeyNeverSet = (key: string) => {
        const item = localStorage.getItem(key);
        // Check if item is null (key not found) or the string "undefined"
        return item === null || item === 'undefined';
      };

      if (wasKeyNeverSet('av_categories')) {
        setCategories(sampleCategories);
      }
      if (wasKeyNeverSet('av_subcategories')) {
        setSubcategories(sampleSubcategories);
      }
      if (wasKeyNeverSet('av_equipment')) {
        setEquipment(sampleEquipment.map(e => ({...e, imageUrl: e.imageUrl || `https://placehold.co/600x400.png` })));
      }
      if (wasKeyNeverSet('av_rentals')) {
         setRentals(sampleRentals); // sampleRentals provides string dates
      }
    };

    populateSampleDataIfNeeded();
    setIsDataLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCategories, setSubcategories, setEquipment, setRentals]); // setX fns are now stable from useLocalStorage

  useEffect(() => {
    if (isDataLoaded) {
      setRentals(prevRentals => {
        let hasChanged = false;
        const newMappedRentals = prevRentals.map(r => {
          let currentStartDate = r.startDate;
          let currentEndDate = r.endDate;
          let rentalItemChanged = false;

          if (typeof currentStartDate === 'string') {
            currentStartDate = new Date(currentStartDate);
            rentalItemChanged = true;
          } else if (!(currentStartDate instanceof Date) && currentStartDate !== null && currentStartDate !== undefined) {
            // Attempt to parse if it's not a Date object already but also not explicitly null/undefined
            currentStartDate = new Date(String(currentStartDate));
            rentalItemChanged = true;
          }


          if (typeof currentEndDate === 'string') {
            currentEndDate = new Date(currentEndDate);
            rentalItemChanged = true;
          } else if (!(currentEndDate instanceof Date) && currentEndDate !== null && currentEndDate !== undefined) {
            currentEndDate = new Date(String(currentEndDate));
            rentalItemChanged = true;
          }
          
          // If parsing failed, currentStartDate/EndDate will be `Invalid Date`. This is intentional.
          // No fallback to new Date() for invalid dates.

          if (rentalItemChanged) {
            hasChanged = true;
            return {
              ...r,
              startDate: currentStartDate,
              endDate: currentEndDate,
            };
          }
          return r;
        });

        if (hasChanged) {
          return newMappedRentals;
        }
        return prevRentals; 
      });
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
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), imageUrl: item.imageUrl || `https://placehold.co/600x400.png` }]);
  };
  const updateEquipmentItem = (updatedItem: EquipmentItem) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedItem.id ? updatedItem : eq));
  };
  const deleteEquipmentItem = (itemId: string) => {
    setEquipment(prev => prev.filter(eq => eq.id !== itemId));
  };

  const addRental = (rental: Omit<Rental, 'id'>) => {
    // Ensure dates are Date objects when adding new rental
    const processedRental = {
      ...rental,
      id: crypto.randomUUID(),
      startDate: rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate),
      endDate: rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate),
    };
    setRentals(prev => [...prev, processedRental]);
  };
  const updateRental = (updatedRental: Rental) => {
     // Ensure dates are Date objects when updating rental
    const processedRental = {
      ...updatedRental,
      startDate: updatedRental.startDate instanceof Date ? updatedRental.startDate : new Date(updatedRental.startDate),
      endDate: updatedRental.endDate instanceof Date ? updatedRental.endDate : new Date(updatedRental.endDate),
    };
    setRentals(prev => prev.map(r => r.id === processedRental.id ? processedRental : r));
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
