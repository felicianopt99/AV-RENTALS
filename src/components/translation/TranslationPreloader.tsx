"use client";

import { useTranslation } from '@/contexts/TranslationContext';

export default function TranslationPreloader() {
  const { isPreloading, cacheStats } = useTranslation();
  
  if (!isPreloading) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      <span className="text-sm">Loading translations...</span>
    </div>
  );
}

// Component to show cache stats (for debugging)
export function TranslationStats() {
  const { cacheStats, isPreloading } = useTranslation();
  const stats = cacheStats();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-3 py-2 rounded text-xs">
      <div>Cache: {stats.size} translations</div>
      {isPreloading && <div>Status: Preloading...</div>}
    </div>
  );
}