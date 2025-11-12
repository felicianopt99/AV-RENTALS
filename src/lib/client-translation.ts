/**
 * Client-side translation service that calls the translation API
 * This is used to avoid Prisma client-side issues while still providing translations
 */

export type Language = 'en' | 'pt';

interface TranslationAPIResponse {
  original: string;
  translated: string;
  targetLang: Language;
}

interface BatchTranslationAPIResponse {
  translations: string[];
  targetLang: Language;
}

class ClientTranslationService {
  private cache = new Map<string, Map<string, string>>();

  /**
   * Translate a single text via API
   */
  async translateText(text: string, targetLang: Language): Promise<string> {
    if (targetLang === 'en') return text;
    if (!text.trim()) return text;

    // Check cache first
    const cacheKey = `${targetLang}:${text}`;
    const langCache = this.cache.get(targetLang) || new Map();
    if (langCache.has(text)) {
      return langCache.get(text)!;
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result: TranslationAPIResponse = await response.json();
      
      // Cache the result
      langCache.set(text, result.translated);
      this.cache.set(targetLang, langCache);

      return result.translated;
    } catch (error) {
      console.error('Client translation error:', error);
      return text; // Fallback to original text
    }
  }

  /**
   * Translate multiple texts via batch API
   */
  async translateBatch(texts: string[], targetLang: Language): Promise<string[]> {
    if (targetLang === 'en') return texts;
    
    const uniqueTexts = [...new Set(texts.filter(t => t.trim()))];
    if (uniqueTexts.length === 0) return texts;

    // Check cache for existing translations
    const langCache = this.cache.get(targetLang) || new Map();
    const cachedResults: string[] = [];
    const textsToTranslate: string[] = [];
    const indexMap: number[] = [];

    texts.forEach((text, index) => {
      if (!text.trim()) {
        cachedResults[index] = text;
      } else if (langCache.has(text)) {
        cachedResults[index] = langCache.get(text)!;
      } else {
        textsToTranslate.push(text);
        indexMap.push(index);
      }
    });

    // If all texts are cached, return cached results
    if (textsToTranslate.length === 0) {
      return cachedResults;
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLang,
          progressive: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch translation API error: ${response.status}`);
      }

      const result: BatchTranslationAPIResponse = await response.json();
      
      // Cache the results and fill in the array
      result.translations.forEach((translated, i) => {
        const originalText = textsToTranslate[i];
        const originalIndex = indexMap[i];
        
        langCache.set(originalText, translated);
        cachedResults[originalIndex] = translated;
      });
      
      this.cache.set(targetLang, langCache);

      return cachedResults;
    } catch (error) {
      console.error('Client batch translation error:', error);
      
      // Fallback: fill missing translations with original text
      indexMap.forEach((originalIndex, i) => {
        if (cachedResults[originalIndex] === undefined) {
          cachedResults[originalIndex] = textsToTranslate[i];
        }
      });
      
      return cachedResults;
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(language?: Language) {
    if (language) {
      this.cache.delete(language);
    } else {
      this.cache.clear();
    }
  }
}

// Export a singleton instance
export const clientTranslationService = new ClientTranslationService();

// Export convenience functions
export const translateText = (text: string, targetLang: Language) => 
  clientTranslationService.translateText(text, targetLang);

export const translateBatch = (texts: string[], targetLang: Language) => 
  clientTranslationService.translateBatch(texts, targetLang);