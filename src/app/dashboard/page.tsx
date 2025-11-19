"use client";
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { useAppContext } from '@/contexts/AppContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { currentUser, isAuthLoading } = useAppContext();
  const router = useRouter();

  // Only allow Admin and Manager
  const allowedRoles = ['Admin', 'Manager'];

  useEffect(() => {
    if (!isAuthLoading && currentUser && !allowedRoles.includes(currentUser.role)) {
      // Redirect unauthorized users to home or show error
      router.replace('/unauthorized');
    }
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Not authenticated.</div>;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-red-600">You do not have permission to access the dashboard.</div>;
  }

  return <DashboardContent />;
}