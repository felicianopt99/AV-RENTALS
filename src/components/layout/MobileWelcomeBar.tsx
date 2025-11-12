"use client";

import Link from "next/link";
import { useAppContext } from "@/contexts/AppContext";
import { CalendarDays, Package, Users, Calendar } from "lucide-react";

import { useTranslate } from '@/contexts/TranslationContext';
export function MobileWelcomeBar() {
  // Translation hooks
  const { translated: clientsText } = useTranslate('Clients');

  const { currentUser } = useAppContext();
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12;
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-4 pt-4 pb-3 sm:hidden">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{timeGreeting}, {currentUser?.name?.split(' ')[0] || 'there'}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">What would you like to do?</p>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <QuickLink href="/clients" icon={Users} label={clientsText} />
        <QuickLink href="/rentals/calendar" icon={CalendarDays} label="Calendar" />
        <Link
          href="/events"
          className="flex items-center gap-2 rounded-full px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 transition-colors border border-blue-200 dark:border-blue-700"
        >
          <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <span>Events</span>
        </Link>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-full px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300 transition-colors"
    >
      <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <span>{label}</span>
    </Link>
  );
}
