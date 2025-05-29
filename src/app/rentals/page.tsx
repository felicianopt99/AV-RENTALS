"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page can be used for a list/table view of all rentals
// For now, it redirects to the rental calendar view
export default function RentalsRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/rentals/calendar');
  }, [router]);

  return <div className="p-6 text-center">Redirecting to rental calendar...</div>;
}
