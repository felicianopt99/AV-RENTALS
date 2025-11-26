"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language } from '@/lib/translation';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => Promise<string>;
  tSync: (text: string) => string;
  tBatch: (texts: string[], progressive?: boolean) => Promise<string[]>;
  preloadTranslations: (texts: string[]) => Promise<void>;
  isTranslating: boolean;
  isPreloading: boolean;
  cacheStats: () => { size: number; keys: string[] };
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Client-side translation cache
const clientCache = new Map<string, string>();

// Client-side batching queue
interface QueuedTranslation {
  text: string;
  resolve: (translation: string) => void;
  reject: (error: any) => void;
}

const translationQueue: QueuedTranslation[] = [];
let isProcessingQueue = false;
let queueProcessTimeout: NodeJS.Timeout | null = null;

// Process queued translations in batches
async function processTranslationQueue(targetLang: Language) {
  if (isProcessingQueue || translationQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    // Collect all queued texts
    const queuedItems = [...translationQueue];
    translationQueue.length = 0; // Clear queue
    
    const texts = queuedItems.map(item => item.text);
    const uniqueTexts = Array.from(new Set(texts));
    
    console.log(`🚀 Processing ${uniqueTexts.length} texts in batch instead of ${texts.length} individual calls`);
    
    // Make batch API call
    const response = await fetch('/api/translate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        texts: uniqueTexts, 
        targetLang,
        progressive: true 
      }),
    });

    if (!response.ok) {
      throw new Error('Batch translation failed');
    }

    const data = await response.json();
    const translations = data.translations || uniqueTexts;
    
    // Create translation map
    const translationMap = new Map<string, string>();
    uniqueTexts.forEach((text, index) => {
      const translated = translations[index] || text;
      translationMap.set(text, translated);
      
      // Cache the result
      const cacheKey = `${targetLang}:${text}`;
      clientCache.set(cacheKey, translated);
    });
    
    // Resolve all queued promises
    queuedItems.forEach(item => {
      const translated = translationMap.get(item.text) || item.text;
      item.resolve(translated);
    });
    
  } catch (error) {
    console.error('Batch translation error:', error);
    
    // Reject all queued promises with fallback to original text
    const currentQueue = [...translationQueue];
    translationQueue.length = 0;
    currentQueue.forEach(item => {
      item.resolve(item.text); // Fallback to original text instead of rejecting
    });
  } finally {
    isProcessingQueue = false;
  }
}

// Add translation to queue with debouncing
function queueTranslation(text: string, targetLang: Language): Promise<string> {
  return new Promise((resolve, reject) => {
    translationQueue.push({ text, resolve, reject });
    
    // Clear existing timeout
    if (queueProcessTimeout) {
      clearTimeout(queueProcessTimeout);
    }
    
    // Process queue after short delay to collect more items
    queueProcessTimeout = setTimeout(() => {
      processTranslationQueue(targetLang).catch(console.error);
    }, 50); // 50ms delay to batch multiple rapid requests
  });
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  // Preload all existing translations from database
  const preloadExistingTranslations = useCallback(async () => {
    try {
      console.log('🔄 Preloading existing translations from database...');
      // Determine a reasonable targetLang to warm up
      let desiredLang: Language | undefined = undefined;
      const savedLang = (typeof window !== 'undefined' ? localStorage.getItem('app-language') : null) as Language | null;
      if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
        desiredLang = savedLang;
      } else {
        const browserLang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
        if (browserLang.startsWith('pt')) desiredLang = 'pt';
      }

      const params = new URLSearchParams();
      if (desiredLang) params.set('targetLang', desiredLang);
      params.set('limit', '1000');
      const url = `/api/translate/preload${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const translations = data.translations || [];
        
        // Cache all existing translations
        translations.forEach((translation: any) => {
          const cacheKey = `${translation.targetLang}:${translation.sourceText}`;
          clientCache.set(cacheKey, translation.translatedText);
        });
        
        console.log(`✅ Preloaded ${translations.length} existing translations into cache`);
      }
    } catch (error) {
      console.error('Failed to preload translations:', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  // Load language preference and preload translations
  useEffect(() => {
    const saved = localStorage.getItem('app-language') as Language;
    if (saved && (saved === 'en' || saved === 'pt')) {
      setLanguageState(saved);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pt')) {
        setLanguageState('pt');
      }
    }

    // Preload existing translations
    preloadExistingTranslations();
  }, [preloadExistingTranslations]);

  // Cross-tab/client cache invalidation when admin updates translations or rules
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'translations-updated') {
        clientCache.clear();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    // Clear cache when language changes to prevent mixed languages
    clientCache.clear();
  }, []);

  // Async translation function with automatic batching
  const t = useCallback(async (text: string): Promise<string> => {
    if (language === 'en' || !text.trim()) {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    
    // Check cache first
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey)!;
    }

    // Use batching queue instead of individual API call
    setIsTranslating(true);
    try {
      const translated = await queueTranslation(text, language);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Synchronous translation function (returns from cache or original)
  const tSync = useCallback((text: string): string => {
    if (language === 'en' || !text.trim()) {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    return clientCache.get(cacheKey) || text;
  }, [language]);

  // Optimized batch translation with smart caching
  const tBatch = useCallback(async (texts: string[], progressive: boolean = true): Promise<string[]> => {
    if (language === 'en' || texts.length === 0) {
      return texts;
    }

    // Check which texts need translation
    const toTranslate: string[] = [];
    const results: string[] = new Array(texts.length);

    texts.forEach((text, index) => {
      const cacheKey = `${language}:${text}`;
      if (clientCache.has(cacheKey)) {
        results[index] = clientCache.get(cacheKey)!;
      } else {
        toTranslate.push(text);
        results[index] = text; // Use original as immediate fallback
      }
    });

    // If all are cached, return immediately
    if (toTranslate.length === 0) {
      return results;
    }

    console.log(`📦 tBatch: ${toTranslate.length} texts need translation, ${texts.length - toTranslate.length} cached`);

    setIsTranslating(true);
    try {
      // Make single batch API call (uses server-side intelligent batching)
      const response = await fetch('/api/translate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          texts: toTranslate, 
          targetLang: language,
          progressive: progressive
        }),
      });

      if (!response.ok) {
        throw new Error('Batch translation failed');
      }

      const data = await response.json();
      const translations = data.translations || toTranslate;

      console.log(`✅ Received ${translations.length} translations`);

      // Update results and cache
      let toTranslateIndex = 0;
      texts.forEach((text, index) => {
        const cacheKey = `${language}:${text}`;
        if (!clientCache.has(cacheKey)) {
          const translated = translations[toTranslateIndex] || text;
          clientCache.set(cacheKey, translated);
          results[index] = translated;
          toTranslateIndex++;
        }
      });

      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      return results; // Return with fallback values
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Preload translations without returning them
  const preloadTranslations = useCallback(async (texts: string[]): Promise<void> => {
    await tBatch(texts);
  }, [tBatch]);

  // Get cache statistics
  const cacheStats = useCallback(() => ({
    size: clientCache.size,
    keys: Array.from(clientCache.keys()),
  }), []);

  return (
    <TranslationContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      tSync, 
      tBatch, 
      preloadTranslations, 
      isTranslating,
      isPreloading,
      cacheStats
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

/**
 * Custom hook for translating text with state management
 * @param text - Text to translate
 * @returns Object with translated text and loading state
 */
export function useTranslate(text: string) {
  const { language, t, tSync } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function translate() {
      if (language === 'en') {
        if (isMounted) setTranslated(text);
        return;
      }

      // Immediately show cached version if available
      const cached = tSync(text);
      if (cached !== text) {
        if (isMounted) setTranslated(cached);
        return; // Already have a translation, no need to fetch
      }

      setIsLoading(true);
      const result = await t(text);
      
      if (isMounted) {
        setTranslated(result);
        setIsLoading(false);
      }
    }

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, language, t, tSync]);

  return { translated, isLoading };
}
