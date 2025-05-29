
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Category, Subcategory, EquipmentItem, Rental, Client } from '@/types';
import { sampleCategories, sampleSubcategories, sampleEquipment, sampleRentals, sampleClients } from '@/lib/sample-data';
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

  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;

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
  const [clients, setClients] = useLocalStorage<Client[]>('av_clients', []);
  const [rentals, setRentals] = useLocalStorage<Rental[]>('av_rentals', []);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const populateSampleDataIfNeeded = () => {
      if (typeof window === 'undefined') return;

      const wasKeyNeverSet = (key: string) => {
        const item = localStorage.getItem(key);
        return item === null || item === 'undefined';
      };

      if (wasKeyNeverSet('av_categories')) setCategories(sampleCategories);
      if (wasKeyNeverSet('av_subcategories')) setSubcategories(sampleSubcategories);
      if (wasKeyNeverSet('av_equipment')) setEquipment(sampleEquipment.map(e => ({...e, imageUrl: e.imageUrl || `https://placehold.co/600x400.png` })));
      if (wasKeyNeverSet('av_clients')) setClients(sampleClients);
      if (wasKeyNeverSet('av_rentals')) setRentals(sampleRentals);
    };

    populateSampleDataIfNeeded();
    setIsDataLoaded(true);
  }, [setCategories, setSubcategories, setEquipment, setClients, setRentals]); // Stable setters

  useEffect(() => {
    if (isDataLoaded) {
      setRentals(prevRentals => {
        let hasChanged = false;
        const newMappedRentals = prevRentals.map(r => {
          let currentStartDate = r.startDate;
          let currentEndDate = r.endDate;
          let rentalItemChanged = false;

          if (!(currentStartDate instanceof Date)) {
            currentStartDate = new Date(String(currentStartDate)); // Will be Invalid Date if parse fails
            rentalItemChanged = true;
          }
          if (!(currentEndDate instanceof Date)) {
            currentEndDate = new Date(String(currentEndDate)); // Will be Invalid Date if parse fails
            rentalItemChanged = true;
          }
          
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

        return hasChanged ? newMappedRentals : prevRentals;
      });
    }
  }, [isDataLoaded, setRentals]); // setRentals is stable


  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: crypto.randomUUID() }]);
  }, [setCategories]);
  const updateCategory = useCallback((updatedCategory: Category) => {
    setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  }, [setCategories]);
  const deleteCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setSubcategories(prev => prev.filter(subcat => subcat.parentId !== categoryId));
  }, [setCategories, setSubcategories]);

  const addSubcategory = useCallback((subcategory: Omit<Subcategory, 'id'>) => {
    setSubcategories(prev => [...prev, { ...subcategory, id: crypto.randomUUID() }]);
  }, [setSubcategories]);
  const updateSubcategory = useCallback((updatedSubcategory: Subcategory) => {
    setSubcategories(prev => prev.map(sub => sub.id === updatedSubcategory.id ? updatedSubcategory : sub));
  }, [setSubcategories]);
  const deleteSubcategory = useCallback((subcategoryId: string) => {
    setSubcategories(prev => prev.filter(sub => sub.id !== subcategoryId));
  }, [setSubcategories]);
  
  const addEquipmentItem = useCallback((item: Omit<EquipmentItem, 'id'>) => {
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), imageUrl: item.imageUrl || `https://placehold.co/600x400.png` }]);
  }, [setEquipment]);
  const updateEquipmentItem = useCallback((updatedItem: EquipmentItem) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedItem.id ? updatedItem : eq));
  }, [setEquipment]);
  const deleteEquipmentItem = useCallback((itemId: string) => {
    setEquipment(prev => prev.filter(eq => eq.id !== itemId));
  }, [setEquipment]);

  const addClient = useCallback((client: Omit<Client, 'id'>) => {
    setClients(prev => [...prev, { ...client, id: crypto.randomUUID() }]);
  }, [setClients]);
  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  }, [setClients]);
  const deleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    // Consider impact on rentals: maybe mark them as "client deleted" or disallow deletion if active rentals. For now, just deletes client.
  }, [setClients]);

  const addRental = useCallback((rental: Omit<Rental, 'id'>) => {
    const processedRental = {
      ...rental,
      id: crypto.randomUUID(),
      startDate: rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate),
      endDate: rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate),
    };
    setRentals(prev => [...prev, processedRental]);
  }, [setRentals]);
  const updateRental = useCallback((updatedRental: Rental) => {
    const processedRental = {
      ...updatedRental,
      startDate: updatedRental.startDate instanceof Date ? updatedRental.startDate : new Date(updatedRental.startDate),
      endDate: updatedRental.endDate instanceof Date ? updatedRental.endDate : new Date(updatedRental.endDate),
    };
    setRentals(prev => prev.map(r => r.id === processedRental.id ? processedRental : r));
  }, [setRentals]);
  const deleteRental = useCallback((rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
  }, [setRentals]);

  return (
    <AppContext.Provider value={{
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      subcategories, setSubcategories, addSubcategory, updateSubcategory, deleteSubcategory,
      equipment, setEquipment, addEquipmentItem, updateEquipmentItem, deleteEquipmentItem,
      clients, setClients, addClient, updateClient, deleteClient,
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
