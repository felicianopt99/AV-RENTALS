"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page can be used for a different view of equipment, e.g., a table view
// For now, it redirects to the main dashboard (root page)
export default function EquipmentRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <div className="p-6 text-center">Redirecting to dashboard...</div>;
}
