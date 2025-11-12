import { NextRequest, NextResponse } from 'next/server';
import { translateText, Language, translateBatch, preloadAllTranslations } from '@/lib/translation';

// Preload translations on first API call
let isPreloading = false;
let preloadPromise: Promise<void> | null = null;

async function ensurePreloaded() {
  if (!preloadPromise && !isPreloading) {
    isPreloading = true;
    preloadPromise = preloadAllTranslations();
    await preloadPromise;
  } else if (preloadPromise) {
    await preloadPromise;
  }
}

export async function POST(request: NextRequest) {
  // Ensure translations are preloaded (non-blocking after first call)
  await ensurePreloaded();
  
  try {
    const body = await request.json();
    const { text, targetLang } = body;

    if (!text || typeof text !== 'string') {
      console.log('Invalid request body');
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!targetLang || (targetLang !== 'en' && targetLang !== 'pt')) {
      return NextResponse.json(
        { error: 'Invalid target language. Must be "en" or "pt"' },
        { status: 400 }
      );
    }

    const translated = await translateText(text, targetLang as Language);
    console.log('Translated text:', translated);

    return NextResponse.json({
      original: text,
      translated,
      targetLang,
    });
  } catch (error) {
    console.error('Translation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to translate', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Batch translations endpoint - optimized with progressive loading
export async function PUT(request: NextRequest) {
  // Ensure translations are preloaded
  await ensurePreloaded();
  
  try {
    const body = await request.json();
    const { texts, targetLang, progressive } = body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Texts must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!targetLang || (targetLang !== 'en' && targetLang !== 'pt')) {
      return NextResponse.json(
        { error: 'Invalid target language. Must be "en" or "pt"' },
        { status: 400 }
      );
    }

    // Use optimized batch function with progressive loading support
    const translations = await translateBatch(texts, targetLang as Language, progressive);
    console.log('Translated texts:', translations);

    return NextResponse.json({
      translations,
      targetLang,
    });
  } catch (error) {
    console.error('Batch translation API error:', error);
    return NextResponse.json(
      { error: 'Batch translation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
