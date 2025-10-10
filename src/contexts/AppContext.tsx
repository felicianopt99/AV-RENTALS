
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Category, Subcategory, EquipmentItem, Rental, Client, Quote, Event, MaintenanceLog, User, UserRole } from '@/types';
import { sampleCategories, sampleSubcategories, sampleEquipment, sampleRentals, sampleClients, sampleQuotes, sampleEvents, sampleUsers } from '@/lib/sample-data';
import useLocalStorage from '@/hooks/useLocalStorage';

// --- State Context ---
interface AppContextState {
  users: User[];
  currentUser: User | null;
  categories: Category[];
  subcategories: Subcategory[];
  equipment: EquipmentItem[];
  clients: Client[];
  events: Event[];
  rentals: Rental[];
  quotes: Quote[];
  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextState | undefined>(undefined);


// --- Dispatch Context ---
interface AppContextDispatch {
  setCurrentUser: (user: User | null) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  addSubcategory: (subcategory: Omit<Subcategory, 'id'>) => void;
  updateSubcategory: (subcategory: Subcategory) => void;
  deleteSubcategory: (subcategoryId: string) => void;
  addEquipmentItem: (item: Omit<EquipmentItem, 'id'>) => void;
  updateEquipmentItem: (item: EquipmentItem) => void;
  deleteEquipmentItem: (itemId: string) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  addEvent: (event: Omit<Event, 'id'>) => string;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  addRental: (rental: Omit<Rental, 'id'>) => void;
  updateRental: (rental: Rental) => void;
  deleteRental: (rentalId: string) => void;
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => string;
  updateQuote: (quote: Quote) => void;
  deleteQuote: (quoteId: string) => void;
  getNextQuoteNumber: () => string;
  approveQuoteAndCreateRentals: (quoteId: string) => Promise<{ success: boolean; message: string }>;
}

const AppDispatchContext = createContext<AppContextDispatch | undefined>(undefined);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('av_users', sampleUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('av_currentUser', null);
  
  const [categories, setCategories] = useLocalStorage<Category[]>('av_categories', sampleCategories);
  const [subcategories, setSubcategories] = useLocalStorage<Subcategory[]>('av_subcategories', sampleSubcategories);
  const [equipment, setEquipment] = useLocalStorage<EquipmentItem[]>('av_equipment', sampleEquipment);
  const [clients, setClients] = useLocalStorage<Client[]>('av_clients', sampleClients);
  const [events, setEvents] = useLocalStorage<Event[]>('av_events', sampleEvents);
  const [rentals, setRentals] = useLocalStorage<Rental[]>('av_rentals', sampleRentals);
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('av_quotes', sampleQuotes);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // This effect ensures data is loaded and the current user is initialized.
    if (!currentUser && users.length > 0) {
        const initialUser = users.find(u => u.role === 'Admin') || users[0];
        setCurrentUser(initialUser);
     }
    setIsDataLoaded(true);
  }, [currentUser, users]); // Removed setCurrentUser from dependency array 

 useEffect(() => {
    const populateSampleDataIfNeeded = () => {
      if (typeof window === 'undefined') return;
      const wasKeyNeverSet = (key: string) => localStorage.getItem(key) === null;
      
      if (wasKeyNeverSet('av_users')) setUsers(sampleUsers);
      if (wasKeyNeverSet('av_categories')) setCategories(sampleCategories);
      if (wasKeyNeverSet('av_subcategories')) setSubcategories(sampleSubcategories);
      if (wasKeyNeverSet('av_equipment')) {
         setEquipment(sampleEquipment.map(e => ({
          ...e, type: e.type || 'equipment', imageUrl: e.imageUrl || `https://placehold.co/600x400.png`, dailyRate: e.dailyRate || 0,
        })));
      } else {
        setEquipment(prev => prev.map(e => ({
          ...e, type: e.type || 'equipment', dailyRate: e.dailyRate || 0, imageUrl: e.imageUrl || `https://placehold.co/600x400.png`
        })));
      }
      if (wasKeyNeverSet('av_clients')) setClients(sampleClients);
      if (wasKeyNeverSet('av_events')) setEvents(sampleEvents);
      if (wasKeyNeverSet('av_rentals')) setRentals(sampleRentals);
      if (wasKeyNeverSet('av_quotes')) setQuotes(sampleQuotes);
    };
    
    populateSampleDataIfNeeded();
    setIsDataLoaded(true);
  }, []); // Removed all setter functions from dependency array since they're stable


  useEffect(() => {
    if (isDataLoaded) {
        const processDates = (items: any[], dateFields: string[]) => {
            return items.map(item => {
                const newItem = { ...item };
                dateFields.forEach(field => {
                    if (newItem[field] && !(newItem[field] instanceof Date)) {
                       newItem[field] = new Date(String(newItem[field]));
                    }
                });
                return newItem;
            });
        };
        setEvents(prev => processDates(prev, ['startDate', 'endDate']));
        setQuotes(prev => processDates(prev, ['startDate', 'endDate', 'createdAt', 'updatedAt']));
    }
  }, [isDataLoaded]); // Removed setter functions from dependency array

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: crypto.randomUUID() }]);
  }, []); // Removed setCategories from dependency array
  const updateCategory = useCallback((updatedCategory: Category) => {
    setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  }, []); // Removed setCategories from dependency array
  const deleteCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setSubcategories(prev => prev.filter(subcat => subcat.parentId !== categoryId));
  }, []); // Removed setter functions from dependency array

  const addSubcategory = useCallback((subcategory: Omit<Subcategory, 'id'>) => {
    setSubcategories(prev => [...prev, { ...subcategory, id: crypto.randomUUID() }]);
  }, []);
  const updateSubcategory = useCallback((updatedSubcategory: Subcategory) => {
    setSubcategories(prev => prev.map(sub => sub.id === updatedSubcategory.id ? updatedSubcategory : sub));
  }, []);
  const deleteSubcategory = useCallback((subcategoryId: string) => {
    setSubcategories(prev => prev.filter(sub => sub.id !== subcategoryId));
  }, []);
  
  const addEquipmentItem = useCallback((item: Omit<EquipmentItem, 'id'>) => {
    setEquipment(prev => [...prev, { ...item, id: crypto.randomUUID(), type: item.type || 'equipment', imageUrl: item.imageUrl || `https://placehold.co/600x400.png`, dailyRate: item.dailyRate || 0 }]);
  }, []);
  const updateEquipmentItem = useCallback((updatedItem: EquipmentItem) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedItem.id ? {...eq, ...updatedItem, type: updatedItem.type || 'equipment', dailyRate: updatedItem.dailyRate || 0, imageUrl: updatedItem.imageUrl || `https://placehold.co/600x400.png` } : eq));
  }, []);
  const deleteEquipmentItem = useCallback((itemId: string) => {
    setEquipment(prev => prev.filter(eq => eq.id !== itemId));
  }, []);

  const addMaintenanceLog = useCallback((log: Omit<MaintenanceLog, 'id'>) => {
    const newLog = { ...log, id: crypto.randomUUID() };
    setEquipment(prev => prev.map(item => {
      if (item.id === log.equipmentId) {
        const history = item.maintenanceHistory ? [...item.maintenanceHistory, newLog] : [newLog];
        return { ...item, maintenanceHistory: history };
      }
      return item;
    }));
  }, []);

  const addClient = useCallback((client: Omit<Client, 'id'>) => {
    setClients(prev => [...prev, { ...client, id: crypto.randomUUID() }]);
  }, []);
  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  }, []);
  const deleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  }, []);

  const addEvent = useCallback((event: Omit<Event, 'id'>): string => {
    const newId = crypto.randomUUID();
    const processedEvent = { ...event, id: newId };
    setEvents(prev => [...prev, processedEvent]);
    return newId;
  }, []);

  const updateEvent = useCallback((updatedEvent: Event) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setRentals(prev => prev.filter(r => r.eventId !== eventId));
  }, []);

  const addRental = useCallback((rental: Omit<Rental, 'id'>) => {
    const newRental = { ...rental, id: crypto.randomUUID() };
    setRentals(prev => [...prev, newRental]);
  }, []);

  const updateRental = useCallback((updatedRental: Rental) => {
    setRentals(prev => prev.map(r => r.id === updatedRental.id ? updatedRental : r));
  }, []);

  const deleteRental = useCallback((rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
  }, []);

  const getNextQuoteNumber = useCallback((): string => {
    const currentYear = new Date().getFullYear();
    const yearQuotes = quotes.filter(q => {
      if (!q.quoteNumber || typeof q.quoteNumber !== 'string') return false;
      const quoteYearMatch = q.quoteNumber.match(/^Q(\d{4})-(\d+)$/);
      return quoteYearMatch && parseInt(quoteYearMatch[1], 10) === currentYear;
    });
    const maxNum = yearQuotes.reduce((max, q) => {
      const numPartMatch = q.quoteNumber.match(/-(\d+)$/);
      const numPart = numPartMatch ? parseInt(numPartMatch[1], 10) : 0;
      return Math.max(max, numPart);
    }, 0);
    return `Q${currentYear}-${String(maxNum + 1).padStart(3, '0')}`;
  }, [quotes]);

  const addQuote = useCallback((quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): string => {
    const newId = crypto.randomUUID();
    const newQuote: Quote = {
        ...quoteData, id: newId, quoteNumber: getNextQuoteNumber(), createdAt: new Date(), updatedAt: new Date(),
    };
    setQuotes(prev => [...prev, newQuote]);
    return newId;
  }, []);

  const updateQuote = useCallback((updatedQuoteData: Quote) => {
    setQuotes(prev => prev.map(q => q.id === updatedQuoteData.id ? { ...updatedQuoteData, updatedAt: new Date() } : q));
  }, []);

  const deleteQuote = useCallback((quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  }, []);

  const approveQuoteAndCreateRentals = useCallback(async (quoteId: string): Promise<{ success: boolean; message: string }> => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return { success: false, message: "Quote not found." };
    if (!quote.clientId) return { success: false, message: "Quote must be associated with an existing client." };
    
    const eventId = addEvent({ name: quote.name, clientId: quote.clientId, location: quote.location || `From Quote #${quote.quoteNumber}`, startDate: quote.startDate, endDate: quote.endDate });
    updateQuote({ ...quote, status: "Accepted", updatedAt: new Date() });
    quote.items.forEach(item => addRental({ eventId, equipmentId: item.equipmentId, quantityRented: item.quantity }));
    return { success: true, message: `Quote "${quote.name || quote.quoteNumber}" approved. Event and rentals created.` };
  }, [quotes, addEvent, updateQuote, addRental]);

  const stateValue = useMemo(() => ({
    users, currentUser, categories, subcategories, equipment, clients, events, rentals, quotes, isDataLoaded
  }), [users, currentUser, categories, subcategories, equipment, clients, events, rentals, quotes, isDataLoaded]);

  const dispatchValue = useMemo(() => ({
    setCurrentUser, addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory,
    addEquipmentItem, updateEquipmentItem, deleteEquipmentItem, addMaintenanceLog, addClient, updateClient, deleteClient,
    addEvent, updateEvent, deleteEvent, addRental, updateRental, deleteRental, addQuote, updateQuote, deleteQuote,
    getNextQuoteNumber, approveQuoteAndCreateRentals
  }), [setCurrentUser, addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory,
    addEquipmentItem, updateEquipmentItem, deleteEquipmentItem, addMaintenanceLog, addClient, updateClient, deleteClient,
    addEvent, updateEvent, deleteEvent, addRental, updateRental, deleteRental, addQuote, updateQuote, deleteQuote,
    getNextQuoteNumber, approveQuoteAndCreateRentals]);

  return (
    <AppContext.Provider value={stateValue}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextState => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const useAppDispatch = (): AppContextDispatch => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) throw new Error('useAppDispatch must be used within an AppProvider');
  return context;
};
