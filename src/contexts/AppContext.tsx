

"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Category, Subcategory, EquipmentItem, Rental, Client, Quote, Event, MaintenanceLog, User, UserRole } from '@/types';
import { sampleCategories, sampleSubcategories, sampleEquipment, sampleRentals, sampleClients, sampleQuotes, sampleEvents, sampleUsers } from '@/lib/sample-data';
import useLocalStorage from '@/hooks/useLocalStorage';

interface AppContextType {
  // User Management
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

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
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;

  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;

  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  addEvent: (event: Omit<Event, 'id'>) => string;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;

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
  approveQuoteAndCreateRentals: (quoteId: string) => Promise<{ success: boolean; message: string }>;


  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('av_users', []);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('av_currentUser', null);
  
  const [categories, setCategories] = useLocalStorage<Category[]>('av_categories', []);
  const [subcategories, setSubcategories] = useLocalStorage<Subcategory[]>('av_subcategories', []);
  const [equipment, setEquipment] = useLocalStorage<EquipmentItem[]>('av_equipment', []);
  const [clients, setClients] = useLocalStorage<Client[]>('av_clients', []);
  const [events, setEvents] = useLocalStorage<Event[]>('av_events', []);
  const [rentals, setRentals] = useLocalStorage<Rental[]>('av_rentals', []);
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('av_quotes', []);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

 useEffect(() => {
    const populateSampleDataIfNeeded = () => {
      if (typeof window === 'undefined') return;

      const wasKeyNeverSet = (key: string) => {
        const item = localStorage.getItem(key);
        return item === null || item === 'undefined'; // Check for explicit 'undefined' string if it was ever set that way
      };
      
      if (wasKeyNeverSet('av_users')) {
        setUsers(sampleUsers);
        if(!currentUser) {
            setCurrentUser(sampleUsers.find(u => u.role === 'Admin') || null);
        }
      }

      if (wasKeyNeverSet('av_categories')) setCategories(sampleCategories);
      if (wasKeyNeverSet('av_subcategories')) setSubcategories(sampleSubcategories);
      if (wasKeyNeverSet('av_equipment')) {
         setEquipment(sampleEquipment.map(e => ({
          ...e, 
          type: e.type || 'equipment',
          imageUrl: e.imageUrl || `https://placehold.co/600x400.png`,
          dailyRate: e.dailyRate || 0,
        })));
      } else {
        // Ensure existing equipment has defaults if they were missing
        setEquipment(prev => prev.map(e => ({
          ...e,
          type: e.type || 'equipment', 
          dailyRate: e.dailyRate || 0,
          imageUrl: e.imageUrl || `https://placehold.co/600x400.png`
        })));
      }
      if (wasKeyNeverSet('av_clients')) setClients(sampleClients);
      if (wasKeyNeverSet('av_events')) setEvents(sampleEvents);
      if (wasKeyNeverSet('av_rentals')) setRentals(sampleRentals);
      if (wasKeyNeverSet('av_quotes')) setQuotes(sampleQuotes);
    };
    
    populateSampleDataIfNeeded();
    setIsDataLoaded(true);
  }, [setCategories, setSubcategories, setEquipment, setClients, setEvents, setRentals, setQuotes, setUsers, setCurrentUser, currentUser]);


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
                        // Only update if it's a valid date and different from original (or if original was not a Date)
                        if (!isNaN(parsedDate.getTime())) {
                           newItem[field] = parsedDate;
                           currentItemChanged = true;
                        } else {
                            // Handle invalid date strings if necessary, e.g., set to null or log error
                            // For now, we'll leave it as is if parsing fails, to avoid overwriting with 'Invalid Date'
                        }
                    }
                });
                if (currentItemChanged) hasChanged = true;
                return newItem;
            });
            return { changed: hasChanged, newItems: newMappedItems };
        };

        setEvents(prevEvents => {
            const { changed, newItems } = processDates(prevEvents, ['startDate', 'endDate']);
            return changed ? newItems : prevEvents;
        });
        setQuotes(prevQuotes => {
            const { changed, newItems } = processDates(prevQuotes, ['startDate', 'endDate', 'createdAt', 'updatedAt']);
            return changed ? newItems : prevQuotes;
        });
    }
  }, [isDataLoaded, setEvents, setQuotes]);


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
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), type: item.type || 'equipment', imageUrl: item.imageUrl || `https://placehold.co/600x400.png`, dailyRate: item.dailyRate || 0 }]);
  }, [setEquipment]);
  const updateEquipmentItem = useCallback((updatedItem: EquipmentItem) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedItem.id ? {...eq, ...updatedItem, type: updatedItem.type || 'equipment', dailyRate: updatedItem.dailyRate || 0, imageUrl: updatedItem.imageUrl || `https://placehold.co/600x400.png` } : eq));
  }, [setEquipment]);
  const deleteEquipmentItem = useCallback((itemId: string) => {
    setEquipment(prev => prev.filter(eq => eq.id !== itemId));
  }, [setEquipment]);

  const addMaintenanceLog = useCallback((log: Omit<MaintenanceLog, 'id'>) => {
    const newLog = { ...log, id: crypto.randomUUID() };
    setEquipment(prev => prev.map(item => {
      if (item.id === log.equipmentId) {
        const history = item.maintenanceHistory ? [...item.maintenanceHistory, newLog] : [newLog];
        return { ...item, maintenanceHistory: history };
      }
      return item;
    }));
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

  const addEvent = useCallback((event: Omit<Event, 'id'>): string => {
    const newId = crypto.randomUUID();
    const processedEvent = {
        ...event,
        id: newId,
        startDate: event.startDate instanceof Date ? event.startDate : new Date(event.startDate),
        endDate: event.endDate instanceof Date ? event.endDate : new Date(event.endDate),
    };
    setEvents(prev => [...prev, processedEvent]);
    return newId;
  }, [setEvents]);
  const updateEvent = useCallback((updatedEvent: Event) => {
    const processedEvent = {
        ...updatedEvent,
        startDate: updatedEvent.startDate instanceof Date ? updatedEvent.startDate : new Date(updatedEvent.startDate),
        endDate: updatedEvent.endDate instanceof Date ? updatedEvent.endDate : new Date(updatedEvent.endDate),
    };
    setEvents(prev => prev.map(e => e.id === processedEvent.id ? processedEvent : e));
  }, [setEvents]);
  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setRentals(prev => prev.filter(r => r.eventId !== eventId));
  }, [setEvents, setRentals]);

  const addRental = useCallback((rental: Omit<Rental, 'id'>) => {
    const newRental = { ...rental, id: crypto.randomUUID() };
    setRentals(prev => [...prev, newRental]);
  }, [setRentals]);

  const updateRental = useCallback((updatedRental: Rental) => {
    setRentals(prev => prev.map(r => r.id === updatedRental.id ? updatedRental : r));
  }, [setRentals]);

  const deleteRental = useCallback((rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
  }, [setRentals]);

  const getNextQuoteNumber = useCallback((): string => {
    const currentYear = new Date().getFullYear();
    const yearQuotes = quotes.filter(q => {
      if (!q.quoteNumber || typeof q.quoteNumber !== 'string') return false;
        const quoteYearMatch = q.quoteNumber.match(/^Q(\d{4})-(\d+)$/);
        return quoteYearMatch && parseInt(quoteYearMatch[1], 10) === currentYear;
    });

    let maxNum = 0;
    if (yearQuotes.length > 0) {
        maxNum = yearQuotes.reduce((max, q) => {
            const numPartMatch = q.quoteNumber.match(/-(\d+)$/);
            const numPart = numPartMatch ? parseInt(numPartMatch[1], 10) : 0;
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

  const approveQuoteAndCreateRentals = useCallback(async (quoteId: string): Promise<{ success: boolean; message: string }> => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) {
      return { success: false, message: "Quote not found." };
    }

    if (!quote.clientId) {
      return { success: false, message: "Quote must be associated with an existing client before it can be approved. Please edit the quote to select a client." };
    }
    
    const client = clients.find(c => c.id === quote.clientId);
    if (!client) {
       return { success: false, message: "Associated client not found. Please verify client selection in the quote." };
    }


    // Create an Event from the Quote
    const eventId = addEvent({
        name: quote.name,
        clientId: quote.clientId,
        location: quote.location || `From Quote #${quote.quoteNumber}`,
        startDate: quote.startDate,
        endDate: quote.endDate,
    });
    
    // Update Quote status
    const updatedQuote: Quote = { ...quote, status: "Accepted", updatedAt: new Date() };
    updateQuote(updatedQuote);

    // Create rentals linked to the new event
    quote.items.forEach(item => {
      addRental({
        eventId: eventId,
        equipmentId: item.equipmentId,
        quantityRented: item.quantity,
      });
    });
    
    return { success: true, message: `Quote "${quote.name || quote.quoteNumber}" approved. Event and rentals created.` };

  }, [quotes, clients, updateQuote, addRental, addEvent]);


  return (
    <AppContext.Provider value={{
      users, currentUser, setCurrentUser,
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      subcategories, setSubcategories, addSubcategory, updateSubcategory, deleteSubcategory,
      equipment, setEquipment, addEquipmentItem, updateEquipmentItem, deleteEquipmentItem, addMaintenanceLog,
      clients, setClients, addClient, updateClient, deleteClient,
      events, setEvents, addEvent, updateEvent, deleteEvent,
      rentals, setRentals, addRental, updateRental, deleteRental,
      quotes, setQuotes, addQuote, updateQuote, deleteQuote, getNextQuoteNumber, approveQuoteAndCreateRentals,
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
