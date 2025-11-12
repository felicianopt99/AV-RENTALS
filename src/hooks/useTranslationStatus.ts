import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Hook to check translation status and cache information
 */
export function useTranslationStatus() {
  const { isPreloading, isTranslating, cacheStats } = useTranslation();
  
  const stats = cacheStats();
  
  return {
    isPreloading,
    isTranslating,
    cacheSize: stats.size,
    isReady: !isPreloading && !isTranslating,
    
    // Helper methods
    getCachedTranslationKeys: () => stats.keys,
    hasCachedTranslation: (text: string, language: string) => 
      stats.keys.includes(`${language}:${text}`),
  };
}

/**
 * Hook to manually trigger page translation after preloading
 */
export function useManualTranslation() {
  const { tBatch, isPreloading } = useTranslation();
  
  const translatePageTexts = async (texts: string[]) => {
    if (isPreloading) {
      console.log('⏳ Waiting for preloading to finish before translating...');
      return texts; // Return originals if still preloading
    }
    
    return await tBatch(texts, true);
  };
  
  return {
    translatePageTexts,
    isReady: !isPreloading,
  };
}