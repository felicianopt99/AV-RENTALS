"use client";

import { CategoryManager } from '@/components/categories/CategoryManager';
import { AppHeader } from '@/components/layout/AppHeader';

export default function CategoriesPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Category Management" />
      <div className="p-4 md:p-6">
        <CategoryManager />
      </div>
    </div>
  );
}
