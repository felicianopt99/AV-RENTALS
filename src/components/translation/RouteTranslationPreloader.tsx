"use client";

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/contexts/TranslationContext';

const routeTexts: Array<{ match: (p: string) => boolean; texts: string[] }> = [
  { match: (p) => p === '/' || p.startsWith('/home'), texts: [
    'Home','Dashboard','Login','Logout','Search','Settings','Clients','Equipment','Rentals','Inventory','Categories','Admin'
  ]},
  { match: (p) => p.startsWith('/login'), texts: [
    'Email','Password','Remember me','Forgot password?','Sign in','Welcome back','Continue','Create account'
  ]},
  { match: (p) => p.startsWith('/dashboard'), texts: [
    'Dashboard','Total Equipment','Total Clients','Upcoming Events','In next 7 days','Needs Maintenance','View details'
  ]},
  { match: (p) => p.startsWith('/clients'), texts: [
    'Clients','Client List','Add Client','Edit Client','Client Details','Name','Email','Phone','Address','Notes','Search clients (name, contact, email, phone)...','Save','Cancel'
  ]},
  // New Client form
  { match: (p) => p.startsWith('/clients/new'), texts: [
    'Client Name / Company',
    'e.g., Acme Corp or John Doe',
    'Contact Person (Optional)',
    'e.g., Jane Smith',
    'Email (Optional)',
    'e.g., contact@example.com',
    'Phone (Optional)',
    'e.g., 555-123-4567',
    'Address (Optional)',
    'e.g., 123 Main St, Anytown, USA',
    'Notes (Optional)',
    'Any relevant notes about the client...',
    'Internal notes for client management.',
    'Add Client'
  ]},
  // Edit Client form
  { match: (p) => /\/clients\/.+\/edit/.test(p), texts: [
    'Client Name / Company',
    'e.g., Acme Corp or John Doe',
    'Contact Person (Optional)',
    'e.g., Jane Smith',
    'Email (Optional)',
    'e.g., contact@example.com',
    'Phone (Optional)',
    'e.g., 555-123-4567',
    'Address (Optional)',
    'e.g., 123 Main St, Anytown, USA',
    'Notes (Optional)',
    'Any relevant notes about the client...',
    'Internal notes for client management.',
    'Update Client'
  ]},
  { match: (p) => p.startsWith('/equipment'), texts: [
    'Equipment','Equipment List','Add Equipment','Edit Equipment','Equipment Details','Equipment Name','Category','Serial Number','Purchase Date','Purchase Price','Daily Rate','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/rentals'), texts: [
    'Rentals','Rental List','New Rental','Rental Details','Start Date','End Date','Client','Equipment','Total Amount','Deposit','Returned','Overdue','Additional notes about the rental...','Search rentals...','Select a client','Select equipment','Select an event','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/events'), texts: [
    'Events','Event','Date','Time','Location','Create','Update','Delete','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/inventory'), texts: [
    'Inventory','Quantity','Total','Available','Rented','In Maintenance','Search','Filter'
  ]},
  { match: (p) => p.startsWith('/categories'), texts: [
    'Categories','Add','Edit','Delete','Name','Description','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/maintenance'), texts: [
    'Maintenance','Needs Maintenance','Select equipment','Create request','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/quotes'), texts: [
    'Quotes','New Quote','Services','Fees','Client','Total','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/admin'), texts: [
    'Admin','Users','Settings','Translations','Backup','Restore','PDF Branding','Save','Cancel','Update','Create'
  ]},
  { match: (p) => p.startsWith('/profile'), texts: [
    'Profile','Logout','Notifications','No notifications','Change password','Save','Cancel'
  ]},
  { match: (p) => p.startsWith('/team'), texts: [
    'Team','Members','Invite','Role','Admin','Manager','Save','Cancel'
  ]},
];

export default function RouteTranslationPreloader() {
  const pathname = usePathname() || '/';
  const { preloadTranslations, language } = useTranslation();

  const texts = useMemo(() => {
    const all: string[] = [];
    for (const r of routeTexts) {
      if (r.match(pathname)) { all.push(...r.texts); }
    }
    return Array.from(new Set(all));
  }, [pathname]);

  useEffect(() => {
    if (language !== 'en' && texts.length > 0) {
      preloadTranslations(texts);
    }
  }, [language, texts, preloadTranslations]);

  return null;
}
