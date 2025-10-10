"use client";

import { useAppContext } from '@/contexts/AppContext';
import { UserManager } from '@/components/admin/UserManager';
import { hasPermission } from '@/lib/permissions';

export default function UsersPage() {
  const { currentUser } = useAppContext();

  if (!currentUser || !hasPermission(currentUser.role, 'canManageUsers')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return <UserManager currentUser={currentUser} />;
}