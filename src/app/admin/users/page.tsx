"use client";

import { useAppContext } from '@/contexts/AppContext';
import { UserManager } from '@/components/admin/UserManager';
import { hasPermission } from '@/lib/permissions';

import { useTranslate } from '@/contexts/TranslationContext';
export default function UsersPage() {
  // Translation hooks
  const { translated: uiAccessDeniedText } = useTranslate('Access Denied');

  const { currentUser } = useAppContext();

  if (!currentUser || !hasPermission(currentUser.role, 'canManageUsers')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{uiAccessDeniedText}</h1>
          <p className="text-gray-600">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return <UserManager currentUser={currentUser} />;
}