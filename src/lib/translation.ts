import { batchTranslateWithDeepL, translateTextWithDeepL } from './deepl';
import { loadTranslationRules } from './translation-rules';
import { prisma } from '@/lib/db';

export type Language = 'en' | 'pt';

// LRU in-memory cache to bound memory usage
class LRUCache {
  private max: number;
  private map: Map<string, string>;
  constructor(maxEntries: number) {
    this.max = Math.max(100, maxEntries);
    this.map = new Map();
  }
  get(key: string): string | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // refresh order
    this.map.delete(key);
    this.map.set(key, value);
    return value;
    }
  set(key: string, value: string): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.max) {
      // delete least-recently used (first item)
      const firstKey = this.map.keys().next().value as string | undefined;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, value);
  }
  clear(): void {
    this.map.clear();
  }
  size(): number {
    return this.map.size;
  }
  keys(): string[] {
    return Array.from(this.map.keys());
  }
}

const translationCache = new LRUCache(parseInt(process.env.TRANSLATION_CACHE_MAX || '5000', 10));

// Pending translation requests to avoid duplicates
const pendingTranslations = new Map<string, Promise<string>>();

// Translation queue system
interface QueuedTranslation {
  texts: string[];
  targetLang: Language;
  resolve: (results: Map<string, string>) => void;
  reject: (error: any) => void;
}

const translationQueue: QueuedTranslation[] = [];
let isProcessingQueue = false;

// No Gemini/Google AI logic needed; DeepL handles all translation.

// Removed full-table preload to avoid heavy memory usage and slow cold starts

// Generate cache key
function getCacheKey(text: string, targetLang: Language): string {
  return `${targetLang}:${text}`;
}

// Simple glossary overrides for Portuguese (PT)
// Ensures specific business terms use desired wording instead of generic DeepL choices
const PT_GLOSSARY: Array<{ pattern: RegExp; replace: string }> = [
  // Whole-word replacements with case sensitivity preserved via explicit patterns
  { pattern: /\bQuotes\b/g, replace: 'Orçamentos' },
  { pattern: /\bQuote\b/g, replace: 'Orçamento' },
  { pattern: /\bquotes\b/g, replace: 'orçamentos' },
  { pattern: /\bquote\b/g, replace: 'orçamento' },
];

function applyGlossary(text: string, targetLang: Language): string {
  if (targetLang !== 'pt') return text;
  let out = text;
  for (const rule of PT_GLOSSARY) {
    out = out.replace(rule.pattern, rule.replace);
  }
  return out;
}

// No rate limiting logic needed for DeepL here; handled by DeepL API or can be added if needed.

// Note: Full-table preload removed in favor of on-demand LRU caching

// Update usage counters for a single translation
async function touchUsage(text: string, targetLang: Language): Promise<void> {
  try {
    await prisma.translation.update({
      where: {
        sourceText_targetLang: {
          sourceText: text,
          targetLang: targetLang,
        },
      },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });
  } catch (e) {
    // Ignore if not found or race conditions
  }
}

// Update usage counters for many translations with small concurrency to avoid overload
async function touchUsageMany(texts: string[], targetLang: Language, concurrency = 10): Promise<void> {
  const queue = [...new Set(texts)];
  let idx = 0;
  async function worker() {
    while (idx < queue.length) {
      const current = idx++;
      const text = queue[current];
      await touchUsage(text, targetLang);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
}

/**
 * Batch fetch translations from database
 * Much faster than individual queries
 */
async function batchFetchFromDb(
  texts: string[],
  targetLang: Language
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  try {
    const translations = await prisma.translation.findMany({
      where: {
        sourceText: { in: texts },
        targetLang: targetLang,
      },
      select: {
        sourceText: true,
        translatedText: true,
      },
    });
    
    translations.forEach(t => {
      results.set(t.sourceText, t.translatedText);
    });
  } catch (error) {
    console.error('Batch fetch error:', error);
  }
  
  return results;
}

// Use DeepL for batch translation
async function batchTranslateWithAI(
  texts: string[],
  targetLang: Language,
  _maxChunkSize: number = 10
): Promise<Map<string, string>> {
  // Use DeepL batch translation directly
  return batchTranslateWithDeepL(texts, targetLang);
}

/**
 * Queue-based translation system
 * Efficiently batches and processes translation requests
 */
async function processTranslationQueue(): Promise<void> {
  if (isProcessingQueue || translationQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    while (translationQueue.length > 0) {
      // Collect texts from multiple queue items up to batch limit
      const batchTexts: string[] = [];
      const queueItems: QueuedTranslation[] = [];
      const maxBatchSize = 20; // Process up to 20 texts at once
      
      while (translationQueue.length > 0 && batchTexts.length < maxBatchSize) {
        const item = translationQueue.shift()!;
        queueItems.push(item);
        batchTexts.push(...item.texts);
      }
      
      // Remove duplicates while preserving order
      const uniqueTexts = Array.from(new Set(batchTexts));
      const targetLang = queueItems[0].targetLang;
      
      try {
        // Process the batch
        const results = await batchTranslateWithAI(uniqueTexts, targetLang, 15);
        
        // Resolve all queue items
        queueItems.forEach(item => {
          const itemResults = new Map<string, string>();
          item.texts.forEach(text => {
            itemResults.set(text, results.get(text) || text);
          });
          item.resolve(itemResults);
        });
        
      } catch (error) {
        // Reject all queue items on error
        queueItems.forEach(item => item.reject(error));
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Add translation request to queue
 */
function queueTranslation(texts: string[], targetLang: Language): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    translationQueue.push({
      texts,
      targetLang,
      resolve,
      reject,
    });
    
    // Start processing if not already running
    processTranslationQueue().catch(console.error);
  });
}

/**
 * Translate text using Google AI with optimized caching
 * Performance optimizations:
 * - In-memory cache (fastest)
 * - Deduplicates concurrent requests
 * - Database persistent cache
 * - AI translation as last resort
 * 
 * @param text - Text to translate
 * @param targetLang - Target language ('pt' for Portuguese European)
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: Language = 'pt'
): Promise<string> {
  // Don't translate if target is English or empty
  if (targetLang === 'en' || !text.trim()) {
    return text;
  }

  const cacheKey = getCacheKey(text, targetLang);
  
  // 1. Check in-memory cache first (fastest - no I/O)
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 1a. Check translation rules for override
  const rules = loadTranslationRules();
  if (rules[text] !== undefined) {
    if (rules[text] === "NO_TRANSLATE") {
      return text;
    }
    return rules[text];
  }

  // 2. Check if translation is already in progress (deduplicate)
  const pending = pendingTranslations.get(cacheKey);
  if (pending) {
    return pending;
  }

  // 3. Create promise for this translation
  const translationPromise = (async () => {
    try {
      // 4. Check database for existing translation
      const existing = await prisma.translation.findUnique({
        where: {
          sourceText_targetLang: {
            sourceText: text,
            targetLang: targetLang,
          },
        },
      });

      if (existing) {
        // Found in database, cache it and return
        translationCache.set(cacheKey, existing.translatedText);
        // fire-and-forget usage update
        touchUsage(text, targetLang).catch(() => {});
        return existing.translatedText;
      }

      // 5. Not in database, translate with DeepL
      console.log(`🔄 Translating "${text}" with DeepL...`);
      let translated = await translateTextWithDeepL(text, targetLang);
      // Apply glossary overrides
      translated = applyGlossary(translated, targetLang);
      // Apply translation rules post-glossary (in case rules are for output)
      if (rules[translated] !== undefined) {
        if (rules[translated] === "NO_TRANSLATE") {
          translated = text;
        } else {
          translated = rules[translated];
        }
      }
      console.log(`✅ DeepL result: "${text}" → "${translated}"`);

      // 6. Save to database permanently (await for reliability)
      try {
        console.log(`💾 Saving translation to database: "${text}" → "${translated}"`);
        await prisma.translation.create({
          data: {
            sourceText: text,
            targetLang: targetLang,
            translatedText: translated,
            model: "deepl",
          },
        });
        console.log(`✅ Successfully saved translation to database`);
      } catch (error: any) {
        // Ignore duplicate key errors (race condition)
        if (!error.code || error.code !== 'P2002') {
          console.error('Failed to save translation:', error);
        } else {
          console.log(`ℹ️  Translation already exists in database: "${text}"`);
        }
      }

      // 7. Cache in memory for fast access
      translationCache.set(cacheKey, translated);

      // Record usage for the new translation
      touchUsage(text, targetLang).catch(() => {});

      return translated;
    } catch (error: any) {
      console.error('Translation error:', error);
      // Fallback to original text on error
      return text;
    } finally {
      // Remove from pending
      pendingTranslations.delete(cacheKey);
    }
  })();

  // Store pending promise
  pendingTranslations.set(cacheKey, translationPromise);
  
  return translationPromise;
}

/**
 * Batch translate multiple texts with progressive loading
 * Returns cached results immediately, loads missing ones in background
 * 
 * @param texts - Array of texts to translate
 * @param targetLang - Target language
 * @param progressive - If true, returns immediately with available translations
 * @returns Array of translated texts
 */
export async function translateBatch(
  texts: string[],
  targetLang: Language = 'pt',
  progressive: boolean = false
): Promise<string[]> {
  if (targetLang === 'en' || texts.length === 0) {
    return texts;
  }

  const results: string[] = new Array(texts.length);
  const uncachedTexts: string[] = [];
  const uncachedIndices: number[] = [];

  // 1. Check in-memory cache first
  texts.forEach((text, index) => {
    const cacheKey = getCacheKey(text, targetLang);
    const cached = translationCache.get(cacheKey);
    
    if (cached) {
      results[index] = cached;
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(index);
      // Fill with original text as fallback
      results[index] = text;
    }
  });

  // If all cached, return immediately
  if (uncachedTexts.length === 0) {
    return results;
  }

  // For progressive mode, start background translation and return current results
  if (progressive) {
    // Start background translation (don't await)
    translateBatchBackground(uncachedTexts, targetLang, uncachedIndices, results);
    return results;
  }

  // 2. Batch fetch from database (single query)
  const dbResults = await batchFetchFromDb(uncachedTexts, targetLang);
  
  const stillMissing: string[] = [];
  const missingIndices: number[] = [];

  uncachedTexts.forEach((text, i) => {
    const index = uncachedIndices[i];
    const dbTranslation = dbResults.get(text);
    
    if (dbTranslation) {
      // Found in DB, cache and use it
      const cacheKey = getCacheKey(text, targetLang);
      translationCache.set(cacheKey, dbTranslation);
      results[index] = dbTranslation;
      // Update usage in background
      touchUsage(text, targetLang).catch(() => {});
    } else {
      stillMissing.push(text);
      missingIndices.push(index);
    }
  });

  // 3. Translate remaining with AI using intelligent batching
  if (stillMissing.length > 0) {
    const aiResults = await batchTranslateWithAI(stillMissing, targetLang);
    stillMissing.forEach((text, i) => {
      const index = missingIndices[i];
      const translatedRaw = aiResults.get(text) || text;
      const translated = applyGlossary(translatedRaw, targetLang);
      results[index] = translated;
    });

    // 3b. Persist newly translated results to database (bulk insert, skip duplicates)
    try {
      const data = stillMissing.map((text) => ({
        sourceText: text,
        targetLang: targetLang,
        translatedText: applyGlossary(aiResults.get(text) || text, targetLang),
        model: 'deepl',
      }));
      if (data.length > 0) {
        await prisma.translation.createMany({ data, skipDuplicates: true });
      }
      // Update in-memory cache as well
      data.forEach((row) => {
        const cacheKey = getCacheKey(row.sourceText, row.targetLang);
        translationCache.set(cacheKey, row.translatedText);
      });
      // Update usage for all newly translated items (background)
      touchUsageMany(stillMissing, targetLang).catch(() => {});
    } catch (err) {
      console.error('Failed to persist batch translations:', err);
    }
  }

  return results;
}

/**
 * Background translation for progressive loading
 */
async function translateBatchBackground(
  texts: string[],
  targetLang: Language,
  indices: number[],
  results: string[]
): Promise<void> {
  try {
    // Check database first
    const dbResults = await batchFetchFromDb(texts, targetLang);
    
    const stillMissing: string[] = [];
    
    texts.forEach((text, i) => {
      const dbTranslation = dbResults.get(text);
      if (dbTranslation) {
        const cacheKey = getCacheKey(text, targetLang);
        translationCache.set(cacheKey, dbTranslation);
        // Update result array (client will get this on next render)
        results[indices[i]] = dbTranslation;
        touchUsage(text, targetLang).catch(() => {});
      } else {
        stillMissing.push(text);
      }
    });
    
    // Translate remaining with AI if any
    if (stillMissing.length > 0) {
      const aiResults = await batchTranslateWithAI(stillMissing, targetLang, 15); // Larger batches for background
      
      stillMissing.forEach(text => {
        const translated = applyGlossary(aiResults.get(text) || text, targetLang);
        const originalIndex = texts.indexOf(text);
        if (originalIndex !== -1) {
          results[indices[originalIndex]] = translated;
        }
      });

      // Persist background translations as well (bulk insert, skip duplicates)
      try {
        const data = stillMissing.map((text) => ({
          sourceText: text,
          targetLang: targetLang,
          translatedText: applyGlossary(aiResults.get(text) || text, targetLang),
          model: 'deepl',
        }));
        if (data.length > 0) {
          await prisma.translation.createMany({ data, skipDuplicates: true });
        }
        // Warm in-memory cache
        data.forEach((row) => {
          const cacheKey = `${row.targetLang}:${row.sourceText}`;
          translationCache.set(cacheKey, row.translatedText);
        });
        // Update usage for missing items
        touchUsageMany(stillMissing, targetLang).catch(() => {});
      } catch (e) {
        console.error('Failed to persist background batch translations:', e);
      }
    }
  } catch (error) {
    console.error('Background translation error:', error);
  }
}

/**
 * Clear in-memory translation cache
 * Note: Database translations are permanent and won't be cleared
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  console.log('In-memory translation cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: translationCache.size(),
    keys: translationCache.keys(),
  };
}

/**
 * Get database translation statistics
 */
export async function getDbTranslationStats() {
  try {
    const count = await prisma.translation.count();
    const byLanguage = await prisma.translation.groupBy({
      by: ['targetLang'],
      _count: true,
    });
    
    return {
      totalTranslations: count,
      byLanguage: byLanguage.map(item => ({
        language: item.targetLang,
        count: item._count,
      })),
    };
  } catch (error) {
    console.error('Error getting DB stats:', error);
    return null;
  }
}
