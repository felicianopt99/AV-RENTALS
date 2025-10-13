
"use client";

import { CategoryManager } from '@/components/categories/CategoryManager';


export default function CategoriesPage() {
  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Added padding here */}
        <CategoryManager />
      </div>
    </div>
  );
}
