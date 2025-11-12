"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Category, Subcategory, EquipmentItem, Rental, Client, Quote, Event, MaintenanceLog, User } from '@/types';
import {
  equipmentAPI,
  categoriesAPI,
  subcategoriesAPI,
  clientsAPI,
  eventsAPI,
  rentalsAPI,
  quotesAPI,
  usersAPI,
  APIError
} from '@/lib/api';

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
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  error: string | null;
  user: User | null; // Added user property
}

const AppContext = createContext<AppContextState | undefined>(undefined);

// --- Dispatch Context ---
interface AppContextDispatch {
  setCurrentUser: (user: User | null) => void;
  login: (username: string, password: string) =>{useTranslate('Promise')}<void>;
  logout: () =>{useTranslate('Promise')}<void>;
  checkAuth: () =>{useTranslate('Promise')}<void>;
  addCategory: (category: Omit<Category, 'id'>) =>{useTranslate('Promise')}<void>;
  updateCategory: (category: Category) =>{useTranslate('Promise')}<void>;
  deleteCategory: (categoryId: string) =>{useTranslate('Promise')}<void>;
  addSubcategory: (subcategory: Omit<Subcategory, 'id'>) =>{useTranslate('Promise')}<void>;
  updateSubcategory: (subcategory: Subcategory) =>{useTranslate('Promise')}<void>;
  deleteSubcategory: (subcategoryId: string) =>{useTranslate('Promise')}<void>;
  addEquipmentItem: (item: Omit<EquipmentItem, 'id'>) =>{useTranslate('Promise')}<void>;
  updateEquipmentItem: (item: EquipmentItem) =>{useTranslate('Promise')}<void>;
  deleteEquipmentItem: (itemId: string) =>{useTranslate('Promise')}<void>;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) =>{useTranslate('Promise')}<void>;
  addClient: (client: Omit<Client, 'id'>) =>{useTranslate('Promise')}<void>;
  updateClient: (client: Client) =>{useTranslate('Promise')}<void>;
  deleteClient: (clientId: string) =>{useTranslate('Promise')}<void>;
  addEvent: (event: Omit<Event, 'id'>) =>{useTranslate('Promise')}<string>;
  updateEvent: (event: Event) =>{useTranslate('Promise')}<void>;
  deleteEvent: (eventId: string) =>{useTranslate('Promise')}<void>;
  addRental: (rental: Omit<Rental, 'id'>) =>{useTranslate('Promise')}<void>;
  updateRental: (rental: Rental) =>{useTranslate('Promise')}<void>;
  deleteRental: (rentalId: string) =>{useTranslate('Promise')}<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) =>{useTranslate('Promise')}<string>;
  updateQuote: (quote: Quote) =>{useTranslate('Promise')}<void>;
  deleteQuote: (quoteId: string) =>{useTranslate('Promise')}<void>;
  generateQuoteNumber: () => string;
  approveQuote: (quote: Quote) =>{useTranslate('Promise')}<{ success: boolean; message: string }>;
  refreshData: () =>{useTranslate('Promise')}<void>;
}

const AppDispatchContext = createContext<AppContextDispatch | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State management using React state
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication functions
  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    setCurrentUser(result.user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      console.log('Logout response status:', response.status);
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout fetch error:', error);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsDataLoaded(false);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const result = await response.json();
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      refreshData();
    }
  }, [isAuthenticated, currentUser]);

  // Load all data from API
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [
        usersData,
        categoriesData,
        subcategoriesData,
        equipmentData,
        clientsData,
        eventsData,
        rentalsData,
        quotesData,
      ] = await Promise.all([
        usersAPI.getAll().catch(e => { console.warn('Users API failed:', e); return []; }),
        categoriesAPI.getAll().catch(e => { console.warn('Categories API failed:', e); return []; }),
        subcategoriesAPI.getAll().catch(e => { console.warn('Subcategories API failed:', e); return []; }),
        equipmentAPI.getAll().catch(e => { console.warn('Equipment API failed:', e); return []; }),
        clientsAPI.getAll().catch(e => { console.warn('Clients API failed:', e); return []; }),
        eventsAPI.getAll().catch(e => { console.warn('Events API failed:', e); return []; }),
        rentalsAPI.getAll().catch(e => { console.warn('Rentals API failed:', e); return []; }),
        quotesAPI.getAll().catch(e => { console.warn('Quotes API failed:', e); return []; }),
      ]);

      setUsers(usersData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setEquipment(equipmentData);
      setClients(clientsData);
      setEvents(eventsData);
      setRentals(rentalsData);
      setQuotes(quotesData);

      if (usersData.length > 0 && !currentUser) {
        const initialUser = usersData.find((u: User) => u.role === 'Admin') || usersData[0];
        setCurrentUser(initialUser);
      }

      setIsDataLoaded(true);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof APIError ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Category operations
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoriesAPI.create(category);
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (updatedCategory: Category) => {
    try {
      const updated = await categoriesAPI.update(updatedCategory);
      setCategories(prev => prev.map(cat => cat.id === updated.id ? updated : cat));
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await categoriesAPI.delete(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setSubcategories(prev => prev.filter(subcat => subcat.parentId !== categoryId));
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  }, []);

  // Subcategory operations
  const addSubcategory = useCallback(async (subcategory: Omit<Subcategory, 'id'>) => {
    try {
      const newSubcategory = await subcategoriesAPI.create(subcategory);
      setSubcategories(prev => [...prev, newSubcategory]);
    } catch (err) {
      console.error('Error adding subcategory:', err);
      throw err;
    }
  }, []);

  const updateSubcategory = useCallback(async (updatedSubcategory: Subcategory) => {
    try {
      const updated = await subcategoriesAPI.update(updatedSubcategory);
      setSubcategories(prev => prev.map(sub => sub.id === updated.id ? updated : sub));
    } catch (err) {
      console.error('Error updating subcategory:', err);
      throw err;
    }
  }, []);

  const deleteSubcategory = useCallback(async (subcategoryId: string) => {
    try {
      await subcategoriesAPI.delete(subcategoryId);
      setSubcategories(prev => prev.filter(sub => sub.id !== subcategoryId));
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      throw err;
    }
  }, []);

  // Equipment operations
  const addEquipmentItem = useCallback(async (item: Omit<EquipmentItem, 'id'>) => {
    try {
      const newItem = await equipmentAPI.create(item);
      setEquipment(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Error adding equipment:', err);
      throw err;
    }
  }, []);

  const updateEquipmentItem = useCallback(async (updatedItem: EquipmentItem) => {
    try {
      const updated = await equipmentAPI.update(updatedItem);
      setEquipment(prev => prev.map(eq => eq.id === updated.id ? updated : eq));
    } catch (err) {
      console.error('Error updating equipment:', err);
      throw err;
    }
  }, []);

  const deleteEquipmentItem = useCallback(async (itemId: string) => {
    try {
      await equipmentAPI.delete(itemId);
      setEquipment(prev => prev.filter(eq => eq.id !== itemId));
    } catch (err) {
      console.error('Error deleting equipment:', err);
      throw err;
    }
  }, []);

  // Maintenance log operations
  const addMaintenanceLog = useCallback(async (log: Omit<MaintenanceLog, 'id'>) => {
    // For now, we'll just refresh the equipment data
    // In a real implementation, you'd have a separate maintenance API
    await refreshData();
  }, [refreshData]);

  // Client operations
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    try {
      const newClient = await clientsAPI.create(client);
      setClients(prev => [...prev, newClient]);
    } catch (err) {
      console.error('Error adding client:', err);
      throw err;
    }
  }, []);

  const updateClient = useCallback(async (updatedClient: Client) => {
    try {
      const updated = await clientsAPI.update(updatedClient);
      setClients(prev => prev.map(client => client.id === updated.id ? updated : client));
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      await clientsAPI.delete(clientId);
      setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  }, []);

  // Event operations
  const addEvent = useCallback(async (event: Omit<Event, 'id'> & { date: Date }): Promise<string> => {
    try {
      const newEvent = await eventsAPI.create(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent.id;
    } catch (err) {
      console.error('Error adding event:', err);
      throw err;
    }
  }, []);

  const updateEvent = useCallback(async (updatedEvent: Event) => {
    try {
      const updated = await eventsAPI.update(updatedEvent);
      setEvents(prev => prev.map(event => event.id === updated.id ? updated : event));
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await eventsAPI.delete(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setRentals(prev => prev.filter(rental => rental.eventId !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err;
    }
  }, []);

  // Rental operations
  const addRental = useCallback(async (rental: Omit<Rental, 'id'>) => {
    try {
      const newRental = await rentalsAPI.create(rental);
      setRentals(prev => [...prev, newRental]);
    } catch (err) {
      console.error('Error adding rental:', err);
      throw err;
    }
  }, []);

  const updateRental = useCallback(async (updatedRental: Rental) => {
    try {
      const updated = await rentalsAPI.update(updatedRental);
      setRentals(prev => prev.map(rental => rental.id === updated.id ? updated : rental));
    } catch (err) {
      console.error('Error updating rental:', err);
      throw err;
    }
  }, []);

  const deleteRental = useCallback(async (rentalId: string) => {
    try {
      await rentalsAPI.delete(rentalId);
      setRentals(prev => prev.filter(rental => rental.id !== rentalId));
    } catch (err) {
      console.error('Error deleting rental:', err);
      throw err;
    }
  }, []);

  // Quote operations
  const generateQuoteNumber = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const existingQuotes = quotes.filter(q => q.quoteNumber.startsWith(`Q${currentYear}-`));
    
    let maxNum = 0;
    existingQuotes.forEach(q => {
      const numPartMatch = q.quoteNumber.match(/-(\d+)$/);
      if (numPartMatch) {
        maxNum = Math.max(maxNum, parseInt(numPartMatch[1]));
      }
    });
    
    return `Q${currentYear}-${String(maxNum + 1).padStart(3, '0')}`;
  }, [quotes]);

  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>{useTranslate('): Promise')}<string> => {
    try {
      const newQuote = await quotesAPI.create(quote);
      setQuotes(prev => [...prev, newQuote]);
      return newQuote.id;
    } catch (err) {
      console.error('Error adding quote:', err);
      throw err;
    }
  }, []);

  const updateQuote = useCallback(async (updatedQuote: Quote) => {
    try {
      const updated = await quotesAPI.update(updatedQuote);
      setQuotes(prev => prev.map(quote => quote.id === updated.id ? updated : quote));
    } catch (err) {
      console.error('Error updating quote:', err);
      throw err;
    }
  }, []);

  const deleteQuote = useCallback(async (quoteId: string) => {
    try {
      await quotesAPI.delete(quoteId);
      setQuotes(prev => prev.filter(quote => quote.id !== quoteId));
    } catch (err) {
      console.error('Error deleting quote:', err);
      throw err;
    }
  }, []);

  const approveQuote = useCallback(async (quote: Quote): Promise<{ success: boolean; message: string }> => {
    try {
      const eventId = await addEvent({ 
        name: quote.name, 
        clientId: quote.clientId || '', 
        location: quote.location || `From Quote #${quote.quoteNumber}`, 
        startDate: quote.startDate, 
        endDate: quote.endDate,
        date: quote.startDate // Added date property
      });
      
      // Create rentals for each equipment item in the quote
      for (const item of quote.items) {
        // Only create rentals for equipment items
        if (item.type === 'equipment' && item.equipmentId && item.quantity) {
          await addRental({
            eventId,
            equipmentId: item.equipmentId,
            quantityRented: item.quantity,
          });
        }
      }

      return { success: true, message: 'Quote approved successfully.' };
    } catch (err) {
      console.error('Error approving quote:', err);
      throw err;
    }
  }, [addEvent, addRental, updateQuote]);

  const contextValue: AppContextState = {
    users,
    currentUser,
    categories,
    subcategories,
    equipment,
    clients,
    events,
    rentals,
    quotes,
    isDataLoaded,
    isLoading,
    isAuthenticated,
    isAuthLoading,
    error,
    user: currentUser, // Set user property
  };

  const dispatchValue: AppContextDispatch = {
    setCurrentUser,
    login,
    logout,
    checkAuth,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addEquipmentItem,
    updateEquipmentItem,
    deleteEquipmentItem,
    addMaintenanceLog,
    addClient,
    updateClient,
    deleteClient,
    addEvent,
    updateEvent,
    deleteEvent,
    addRental,
    updateRental,
    deleteRental,
    addQuote,
    updateQuote,
    deleteQuote,
    generateQuoteNumber,
    approveQuote,
    refreshData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}