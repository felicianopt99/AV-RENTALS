
import { prisma } from '@/lib/db';

export type Language = 'en' | 'pt';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * Translates a single text string using the DeepL API.
 *
 * @param text The text to translate.
 * @param targetLang The target language ('en' or 'pt').
 * @returns The translated text.
 */
export async function translateTextWithDeepL(text: string, targetLang: Language): Promise<string> {
  if (!DEEPL_API_KEY) {
    throw new Error('DEEPL_API_KEY is not set in environment variables.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang.toUpperCase(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepL API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error('Error translating with DeepL:', error);
    // Fallback to original text in case of an error
    return text;
  }
}

/**
 * Translates a batch of texts using the DeepL API.
 *
 * @param texts An array of texts to translate.
 * @param targetLang The target language.
 * @returns A Map where keys are original texts and values are translated texts.
 */
export async function batchTranslateWithDeepL(
  texts: string[],
  targetLang: Language
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  if (texts.length === 0 || !DEEPL_API_KEY) {
    if (!DEEPL_API_KEY) {
      console.error('DEEPL_API_KEY is not set.');
    }
    return results;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang.toUpperCase(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepL API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    data.translations.forEach((translation: { text: string }, index: number) => {
      results.set(texts[index], translation.text);
    });

  } catch (error) {
    console.error('Error in batch translation with DeepL:', error);
    // Fallback for failed batch
    texts.forEach(text => results.set(text, text));
  }

  return results;
}
