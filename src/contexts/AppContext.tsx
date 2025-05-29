
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Category, Subcategory, EquipmentItem, Rental, Client, Quote } from '@/types';
import { sampleCategories, sampleSubcategories, sampleEquipment, sampleRentals, sampleClients, sampleQuotes } from '@/lib/sample-data';
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
  
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => string; // Returns new quote ID
  updateQuote: (quote: Quote) => void;
  deleteQuote: (quoteId: string) => void;
  getNextQuoteNumber: () => string;

  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useLocalStorage<Category[]>('av_categories', []);
  const [subcategories, setSubcategories] = useLocalStorage<Subcategory[]>('av_subcategories', []);
  const [equipment, setEquipment] = useLocalStorage<EquipmentItem[]>('av_equipment', []);
  const [clients, setClients] = useLocalStorage<Client[]>('av_clients', []);
  const [rentals, setRentals] = useLocalStorage<Rental[]>('av_rentals', []);
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('av_quotes', []);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

 useEffect(() => {
    const populateSampleDataIfNeeded = () => {
      if (typeof window === 'undefined') return;

      const wasKeyNeverSet = (key: string) => {
        const item = localStorage.getItem(key);
        return item === null || item === 'undefined';
      };
      
      // Use stable setters from useLocalStorage in the dependency array
      if (wasKeyNeverSet('av_categories')) setCategories(sampleCategories);
      if (wasKeyNeverSet('av_subcategories')) setSubcategories(sampleSubcategories);
      if (wasKeyNeverSet('av_equipment')) {
         setEquipment(sampleEquipment.map(e => ({
          ...e, 
          imageUrl: e.imageUrl || `https://placehold.co/600x400.png`,
          dailyRate: e.dailyRate || 0,
        })));
      } else {
        setEquipment(prev => prev.map(e => ({...e, dailyRate: e.dailyRate || 0, imageUrl: e.imageUrl || `https://placehold.co/600x400.png`})));
      }
      if (wasKeyNeverSet('av_clients')) setClients(sampleClients);
      if (wasKeyNeverSet('av_rentals')) setRentals(sampleRentals);
      if (wasKeyNeverSet('av_quotes')) setQuotes(sampleQuotes);
    };
    
    populateSampleDataIfNeeded();
    setIsDataLoaded(true);
  }, [setCategories, setSubcategories, setEquipment, setClients, setRentals, setQuotes]);


  useEffect(() => {
    if (isDataLoaded) {
        const processDates = (items: any[], dateFields: string[]): { changed: boolean, newItems: any[] } => {
            let hasChanged = false;
            const newMappedItems = items.map(item => {
                let currentItemChanged = false;
                const newItem = { ...item };
                dateFields.forEach(field => {
                    if (newItem[field] && !(newItem[field] instanceof Date)) {
                        const parsedDate = new Date(String(newItem[field]));
                        if (!isNaN(parsedDate.getTime())) {
                           newItem[field] = parsedDate;
                           currentItemChanged = true;
                        }
                    }
                });
                if (currentItemChanged) hasChanged = true;
                return newItem;
            });
            return { changed: hasChanged, newItems: newMappedItems };
        };

        setRentals(prevRentals => {
            const { changed, newItems } = processDates(prevRentals, ['startDate', 'endDate']);
            return changed ? newItems : prevRentals;
        });
        setQuotes(prevQuotes => {
            const { changed, newItems } = processDates(prevQuotes, ['startDate', 'endDate', 'createdAt', 'updatedAt']);
            return changed ? newItems : prevQuotes;
        });
    }
  }, [isDataLoaded, setRentals, setQuotes]);


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
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), imageUrl: item.imageUrl || `https://placehold.co/600x400.png`, dailyRate: item.dailyRate || 0 }]);
  }, [setEquipment]);
  const updateEquipmentItem = useCallback((updatedItem: EquipmentItem) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedItem.id ? {...eq, ...updatedItem, dailyRate: updatedItem.dailyRate || 0, imageUrl: updatedItem.imageUrl || `https://placehold.co/600x400.png` } : eq));
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

  const getNextQuoteNumber = useCallback((): string => {
    const currentYear = new Date().getFullYear();
    // Filter quotes for the current year to find the highest sequence number for that year.
    const yearQuotes = quotes.filter(q => {
        const quoteYear = parseInt(q.quoteNumber.substring(1, 5), 10); // Assumes QYYYY-NNN format
        return quoteYear === currentYear;
    });

    let maxNum = 0;
    if (yearQuotes.length > 0) {
        maxNum = yearQuotes.reduce((max, q) => {
            const numPart = parseInt(q.quoteNumber.split('-')[1] || '0', 10);
            return Math.max(max, numPart);
        }, 0);
    }
    return `Q${currentYear}-${String(maxNum + 1).padStart(3, '0')}`;
  }, [quotes]);

  const addQuote = useCallback((quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): string => {
    const newId = crypto.randomUUID();
    const newQuote: Quote = {
        ...quoteData,
        id: newId,
        quoteNumber: getNextQuoteNumber(),
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: quoteData.startDate instanceof Date ? quoteData.startDate : new Date(quoteData.startDate),
        endDate: quoteData.endDate instanceof Date ? quoteData.endDate : new Date(quoteData.endDate),
    };
    setQuotes(prev => [...prev, newQuote]);
    return newId;
  }, [setQuotes, getNextQuoteNumber]);

  const updateQuote = useCallback((updatedQuoteData: Quote) => {
    setQuotes(prev => prev.map(q => q.id === updatedQuoteData.id ? {
        ...updatedQuoteData, 
        updatedAt: new Date(),
        startDate: updatedQuoteData.startDate instanceof Date ? updatedQuoteData.startDate : new Date(updatedQuoteData.startDate),
        endDate: updatedQuoteData.endDate instanceof Date ? updatedQuoteData.endDate : new Date(updatedQuoteData.endDate),
        createdAt: updatedQuoteData.createdAt instanceof Date ? updatedQuoteData.createdAt : new Date(updatedQuoteData.createdAt),
      } : q));
  }, [setQuotes]);

  const deleteQuote = useCallback((quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  }, [setQuotes]);


  return (
    <AppContext.Provider value={{
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      subcategories, setSubcategories, addSubcategory, updateSubcategory, deleteSubcategory,
      equipment, setEquipment, addEquipmentItem, updateEquipmentItem, deleteEquipmentItem,
      clients, setClients, addClient, updateClient, deleteClient,
      rentals, setRentals, addRental, updateRental, deleteRental,
      quotes, setQuotes, addQuote, updateQuote, deleteQuote, getNextQuoteNumber,
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

