import { NextRequest, NextResponse } from 'next/server';
import { translateText, Language, translateBatch } from '@/lib/translation';
import { prisma } from '@/lib/db';

// Removed full-table preload in favor of on-demand LRU caching

// Simple in-memory rate limiter (best-effort; use Redis for multi-instance)
type Key = string;
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per key per window
const bucket = new Map<Key, { start: number; count: number }>();

function getClientKey(req: NextRequest): Key {
  const ipHeader = req.headers.get('x-forwarded-for') || '';
  const ip = ipHeader.split(',')[0].trim() || (req as any).ip || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  return `${ip}:${ua.slice(0, 40)}`;
}

function rateLimit(req: NextRequest): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = bucket.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    bucket.set(key, { start: now, count: 1 });
    return true;
    }
  if (entry.count >= MAX_REQUESTS) {
    return false;
  }
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(request)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
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
  try {
    if (!rateLimit(request)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const body = await request.json();
    const { texts, targetLang, progressive } = body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Texts must be a non-empty array' },
        { status: 400 }
      );
    }

    // Cap batch size
    if (texts.length > 100) {
      return NextResponse.json(
        { error: 'Too many texts in one request. Max 100.' },
        { status: 413 }
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
