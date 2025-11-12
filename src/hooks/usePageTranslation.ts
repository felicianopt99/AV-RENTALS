"use client";

/**
 * Hook for page translation - now uses database-first approach
 * With 313 translations cached, most content is already translated
 */
export function usePageTranslation(enabled: boolean = true, delay: number = 500) {
  // With database translations cached, no additional translation needed
  // The translation system automatically uses database first
  return { enabled, delay };
}
