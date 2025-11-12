import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

export type Language = 'en' | 'pt';

// In-memory cache for fast lookups (avoids DB queries)
const translationCache = new Map<string, string>();

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

// Enhanced rate limiting for free tier
let requestCount = 0;
let requestResetTime = Date.now() + 60000; // Reset every minute
const MAX_REQUESTS_PER_MINUTE = 2; // Free tier: 2 requests per minute
const DAILY_LIMIT_PER_KEY = 250; // Daily limit per key
const keyUsageCount = new Map<number, number>(); // Track daily usage per key
const keyLastRequestTime = new Map<number, number>(); // Track last request time per key

// Initialize Google AI with multiple keys for better redundancy
const API_KEYS = [
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw", // Backup key
  "AIzaSyCT1u6CRPw3TVcOZmNfDzKD8D0WidGreis", // Third key  
  "AIzaSyB43Ac2fZ6_u5BAO9NnigBK9bWl6u5wNl0"  // Fourth key
].filter(Boolean);

let currentKeyIndex = 0;

function getGenAI() {
  return new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
}

function rotateApiKey() {
  const originalIndex = currentKeyIndex;
  let attempts = 0;
  
  do {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    attempts++;
    
    // Check if this key is available (not at daily limit)
    const usage = keyUsageCount.get(currentKeyIndex) || 0;
    if (usage < DAILY_LIMIT_PER_KEY) {
      console.log(`🔄 Rotated to API key ${currentKeyIndex + 1}/${API_KEYS.length} (${usage}/${DAILY_LIMIT_PER_KEY} used)`);
      return;
    }
  } while (attempts < API_KEYS.length && currentKeyIndex !== originalIndex);
  
  // If all keys are exhausted, stay on current key and log warning
  console.log(`⚠️  All API keys may be at daily limit. Current key: ${currentKeyIndex + 1}/${API_KEYS.length}`);
}

// Preload flag to avoid multiple DB queries on startup
let isPreloaded = false;

// Generate cache key
function getCacheKey(text: string, targetLang: Language): string {
  return `${targetLang}:${text}`;
}

// Enhanced rate limiting with per-key tracking
async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Check if current key has reached daily limit
  const currentKeyUsage = keyUsageCount.get(currentKeyIndex) || 0;
  if (currentKeyUsage >= DAILY_LIMIT_PER_KEY) {
    console.log(`⚠️  Key ${currentKeyIndex + 1} reached daily limit, rotating...`);
    rotateApiKey();
  }
  
  // Check minute-based rate limit (more conservative for free tier)
  const lastRequestTime = keyLastRequestTime.get(currentKeyIndex) || 0;
  const timeSinceLastRequest = now - lastRequestTime;
  const minDelayBetweenRequests = 60000 / MAX_REQUESTS_PER_MINUTE; // 30s for 2/min
  
  if (timeSinceLastRequest < minDelayBetweenRequests) {
    const waitTime = minDelayBetweenRequests - timeSinceLastRequest;
    console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update tracking
  keyLastRequestTime.set(currentKeyIndex, Date.now());
  keyUsageCount.set(currentKeyIndex, currentKeyUsage + 1);
  
  // Legacy rate limiting (fallback)
  if (now >= requestResetTime) {
    requestCount = 0;
    requestResetTime = now + 60000;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = requestResetTime - now;
    console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
    requestCount = 0;
    requestResetTime = Date.now() + 60000;
  }
  
  requestCount++;
}

/**
 * Preload all translations from database into memory cache
 * This significantly improves performance by avoiding DB queries
 */
export async function preloadAllTranslations(): Promise<void> {
  if (isPreloaded) return;
  
  try {
    const allTranslations = await prisma.translation.findMany({
      select: {
        sourceText: true,
        targetLang: true,
        translatedText: true,
      },
    });
    
    allTranslations.forEach(t => {
      const cacheKey = getCacheKey(t.sourceText, t.targetLang as Language);
      translationCache.set(cacheKey, t.translatedText);
    });
    
    isPreloaded = true;
    console.log(`✓ Preloaded ${allTranslations.length} translations into memory`);
  } catch (error) {
    console.error('Failed to preload translations:', error);
  }
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

/**
 * Intelligent batch AI translation
 * Groups multiple texts into single API requests to dramatically reduce rate limiting
 * @param texts - Array of texts to translate
 * @param targetLang - Target language
 * @param maxChunkSize - Maximum texts per API call (default: 10)
 */
async function batchTranslateWithAI(
  texts: string[],
  targetLang: Language,
  maxChunkSize: number = 10
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  if (texts.length === 0) return results;
  
  // Split into chunks to avoid overwhelming the AI
  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += maxChunkSize) {
    chunks.push(texts.slice(i, i + maxChunkSize));
  }
  
  for (const chunk of chunks) {
    try {
      await checkRateLimit();
      
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000, // Increased for batch responses
        }
      });
      
      // Create structured prompt for batch translation
      const numberedTexts = chunk.map((text, i) => `${i + 1}. ${text}`).join('\n');
      
      const prompt = `Translate the following numbered list of texts to Portuguese (European Portugal variant, not Brazilian).
Keep any technical terms, brand names, and formatting intact.
Return ONLY the translations in the same numbered format, one per line.
Do not include any explanations or additional text.

Texts to translate:
${numberedTexts}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      // Parse the numbered response
      const translatedLines = response.split('\n').filter(line => line.trim());
      
      chunk.forEach((originalText, index) => {
        // Try to extract translation from numbered response
        let translated = originalText; // fallback
        
        if (translatedLines[index]) {
          const match = translatedLines[index].match(/^\d+\.\s*(.+)$/);
          if (match && match[1]) {
            translated = match[1].trim();
          } else {
            // If no number format, use the line as is
            translated = translatedLines[index].trim();
          }
        }
        
        results.set(originalText, translated);
        
        // Cache in memory
        const cacheKey = getCacheKey(originalText, targetLang);
        translationCache.set(cacheKey, translated);
        
        // Save to database (fire and forget)
        prisma.translation.create({
          data: {
            sourceText: originalText,
            targetLang: targetLang,
            translatedText: translated,
            model: "gemini-2.5-flash",
          },
        }).catch(error => {
          if (!error.code || error.code !== 'P2002') {
            console.error('Failed to save batch translation:', error);
          }
        });
      });
      
      console.log(`✓ Batch translated ${chunk.length} texts in one API call`);
      
    } catch (error: any) {
      console.error('Batch AI translation error:', error);
      
      // Check if we should rotate API key
      if (error.message?.includes('429') || error.message?.includes('quota') || 
          error.message?.includes('503') || error.message?.includes('overloaded')) {
        console.log('⚠️  API issue detected, rotating to next key...');
        rotateApiKey();
      }
      
      // Fallback to individual translations for this chunk
      for (const text of chunk) {
        results.set(text, text); // Use original as fallback
      }
    }
  }
  
  return results;
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
        return existing.translatedText;
      }

      // 5. Not in database, translate with AI
      await checkRateLimit();
      
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      });
      
      const prompt = `Translate the following text to Portuguese (European Portugal variant, not Brazilian).
Keep any technical terms, brand names, and formatting intact.
Only return the translated text, nothing else.

Text to translate: "${text}"`;

      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      
      // 6. Save to database permanently (don't await - fire and forget)
      prisma.translation.create({
        data: {
          sourceText: text,
          targetLang: targetLang,
          translatedText: translated,
          model: "gemini-2.5-flash",
        },
      }).catch(error => {
        // Ignore duplicate key errors (race condition)
        if (!error.code || error.code !== 'P2002') {
          console.error('Failed to save translation:', error);
        }
      });

      // 7. Cache in memory for fast access
      translationCache.set(cacheKey, translated);
      
      return translated;
    } catch (error: any) {
      console.error('Translation error:', error);
      
      // Check if we should rotate API key
      if (error.message?.includes('429') || error.message?.includes('quota') || 
          error.message?.includes('503') || error.message?.includes('overloaded')) {
        console.log('⚠️  API issue detected, rotating to next key...');
        rotateApiKey();
      }
      
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
      const translated = aiResults.get(text) || text;
      results[index] = translated;
    });
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
      } else {
        stillMissing.push(text);
      }
    });
    
    // Translate remaining with AI if any
    if (stillMissing.length > 0) {
      const aiResults = await batchTranslateWithAI(stillMissing, targetLang, 15); // Larger batches for background
      
      stillMissing.forEach(text => {
        const translated = aiResults.get(text) || text;
        const originalIndex = texts.indexOf(text);
        if (originalIndex !== -1) {
          results[indices[originalIndex]] = translated;
        }
      });
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
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
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
