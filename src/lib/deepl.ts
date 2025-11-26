
import { prisma } from '@/lib/db';

export type Language = 'en' | 'pt';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const MAX_RETRIES = parseInt(process.env.DEEPL_MAX_RETRIES || '3', 10);
const BASE_DELAY_MS = parseInt(process.env.DEEPL_RETRY_BASE_DELAY_MS || '500', 10);
const MAX_CONCURRENCY = parseInt(process.env.DEEPL_MAX_CONCURRENCY || '4', 10);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcBackoffDelay(attempt: number): number {
  const expo = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 250); // 0-250ms
  return expo + jitter;
}

// Simple per-instance concurrency limiter (semaphore)
let inflight = 0;
const waitQueue: Array<() => void> = [];

async function withConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_CONCURRENCY) {
    await new Promise<void>(resolve => waitQueue.push(resolve));
  }
  inflight++;
  try {
    return await fn();
  } finally {
    inflight--;
    const next = waitQueue.shift();
    if (next) next();
  }
}

async function deepLFetchWithRetry(body: any, signal?: AbortSignal): Promise<Response> {
  if (!DEEPL_API_KEY) {
    throw new Error('DEEPL_API_KEY is not set in environment variables.');
  }

  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await withConcurrency(() => fetch(DEEPL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: signal ?? controller.signal,
      }));
      clearTimeout(timeoutId);
      if (response.ok) return response;

      // Retry on 429 and 5xx
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        lastError = new Error(`DeepL HTTP ${response.status}`);
      } else {
        // Non-retryable
        return response;
      }
    } catch (err) {
      lastError = err;
    }

    // Backoff before next attempt if not the last
    if (attempt < MAX_RETRIES) {
      const delay = calcBackoffDelay(attempt);
      await sleep(delay);
    }
  }
  throw lastError || new Error('DeepL request failed after retries');
}

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
    const response = await deepLFetchWithRetry({
      text: [text],
      target_lang: targetLang.toUpperCase(),
    });

    if (!response.ok) {
      let message = response.statusText;
      try { const errorData = await response.json(); message = errorData.message || message; } catch {}
      throw new Error(`DeepL API error: ${message}`);
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
    const response = await deepLFetchWithRetry({
      text: texts,
      target_lang: targetLang.toUpperCase(),
    });

    if (!response.ok) {
      let message = response.statusText;
      try { const errorData = await response.json(); message = errorData.message || message; } catch {}
      throw new Error(`DeepL API error: ${message}`);
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
