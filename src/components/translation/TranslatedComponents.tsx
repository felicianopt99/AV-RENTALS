"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Component that translates its children text content
 */
export function T({ children, fallback }: { children: string; fallback?: string }) {
  const { language, tSync, t } = useTranslation();
  const [translated, setTranslated] = useState(children);

  useEffect(() => {
    if (language === 'en') {
      setTranslated(children);
      return;
    }

    // Try sync first (cached)
    const cached = tSync(children);
    if (cached !== children) {
      setTranslated(cached);
      return;
    }

    // Fetch translation
    let isMounted = true;
    t(children).then(result => {
      if (isMounted) setTranslated(result);
    });

    return () => { isMounted = false; };
  }, [children, language, t, tSync]);

  return <>{translated || fallback || children}</>;
}

/**
 * Preload component - loads translations in background
 */
export function PreloadTranslations({ texts }: { texts: string[] }) {
  const { preloadTranslations, language } = useTranslation();

  useEffect(() => {
    if (language !== 'en' && texts.length > 0) {
      preloadTranslations(texts);
    }
  }, [texts, language, preloadTranslations]);

  return null;
}

/**
 * Common UI text translations
 */
export const CommonTranslations = {
  // Actions
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  add: "Add",
  create: "Create",
  update: "Update",
  submit: "Submit",
  confirm: "Confirm",
  back: "Back",
  next: "Next",
  finish: "Finish",
  close: "Close",
  search: "Search",
  filter: "Filter",
  export: "Export",
  import: "Import",
  download: "Download",
  upload: "Upload",
  print: "Print",
  refresh: "Refresh",
  clear: "Clear",
  apply: "Apply",
  reset: "Reset",
  
  // Status
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
  
  // Common labels
  name: "Name",
  description: "Description",
  status: "Status",
  date: "Date",
  time: "Time",
  price: "Price",
  total: "Total",
  quantity: "Quantity",
  notes: "Notes",
  email: "Email",
  phone: "Phone",
  address: "Address",
  
  // Messages
  loading: "Loading...",
  saving: "Saving...",
  success: "Success!",
  error: "Error",
  noData: "No data available",
  searchPlaceholder: "Search...",
  
  // Confirmations
  deleteConfirm: "Are you sure you want to delete this?",
  cancelConfirm: "Are you sure you want to cancel?",
  unsavedChanges: "You have unsaved changes",
  
  // Validation
  required: "This field is required",
  invalidEmail: "Invalid email address",
  invalidPhone: "Invalid phone number",
};

/**
 * Hook to preload common translations
 */
export function usePreloadCommonTranslations() {
  const { preloadTranslations, language } = useTranslation();

  useEffect(() => {
    if (language !== 'en') {
      const texts = Object.values(CommonTranslations);
      preloadTranslations(texts);
    }
  }, [language, preloadTranslations]);
}

/**
 * Navigation translations
 */
export const NavigationTranslations = {
  dashboard: "Dashboard",
  equipment: "Equipment",
  rentals: "Rentals",
  clients: "Clients",
  maintenance: "Maintenance",
  quotes: "Quotes",
  events: "Events",
  inventory: "Inventory",
  reports: "Reports",
  settings: "Settings",
  profile: "Profile",
  team: "Team",
  categories: "Categories",
  admin: "Admin",
  home: "Home",
  logout: "Logout",
  login: "Login",
};

/**
 * Equipment translations
 */
export const EquipmentTranslations = {
  equipmentList: "Equipment List",
  addEquipment: "Add Equipment",
  editEquipment: "Edit Equipment",
  equipmentDetails: "Equipment Details",
  equipmentName: "Equipment Name",
  category: "Category",
  serialNumber: "Serial Number",
  purchaseDate: "Purchase Date",
  purchasePrice: "Purchase Price",
  dailyRate: "Daily Rate",
  available: "Available",
  rented: "Rented",
  maintenance: "In Maintenance",
  condition: "Condition",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

/**
 * Rental translations
 */
export const RentalTranslations = {
  rentalList: "Rental List",
  newRental: "New Rental",
  rentalDetails: "Rental Details",
  startDate: "Start Date",
  endDate: "End Date",
  client: "Client",
  equipment: "Equipment",
  totalAmount: "Total Amount",
  deposit: "Deposit",
  returned: "Returned",
  overdue: "Overdue",
  pickupLocation: "Pickup Location",
  returnLocation: "Return Location",
};

/**
 * Client translations
 */
export const ClientTranslations = {
  clientList: "Client List",
  addClient: "Add Client",
  editClient: "Edit Client",
  clientDetails: "Client Details",
  clientName: "Client Name",
  companyName: "Company Name",
  contactPerson: "Contact Person",
  taxId: "Tax ID",
  billingAddress: "Billing Address",
  shippingAddress: "Shipping Address",
};

/**
 * Component to translate navigation items
 */
export function TranslatedNav({ item }: { item: keyof typeof NavigationTranslations }) {
  return <T>{NavigationTranslations[item]}</T>;
}

/**
 * Batch translation helper component
 */
export function TranslatedText({ text, className }: { text: string; className?: string }) {
  const { translated } = useTranslate(text);
  return <span className={className}>{translated}</span>;
}

/**
 * Hook for single text translation
 */
export function useTranslate(text: string) {
  const { language, t, tSync } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function translate() {
      if (language === 'en') {
        if (isMounted) setTranslated(text);
        return;
      }

      // Immediately show cached version if available
      const cached = tSync(text);
      if (cached !== text) {
        if (isMounted) setTranslated(cached);
        return;
      }

      setIsLoading(true);
      const result = await t(text);
      
      if (isMounted) {
        setTranslated(result);
        setIsLoading(false);
      }
    }

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, language, t, tSync]);

  return { translated, isLoading };
}
