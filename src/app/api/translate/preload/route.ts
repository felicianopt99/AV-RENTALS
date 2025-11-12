import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/translate/preload
 * Returns all existing translations from database for client-side caching
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📦 Preload API: Fetching all translations from database...');
    
    const translations = await prisma.translation.findMany({
      select: {
        sourceText: true,
        targetLang: true,
        translatedText: true,
      },
      // Limit to prevent huge payloads (get most recent 1000)
      take: 1000,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Preload API: Found ${translations.length} translations in database`);

    return NextResponse.json({
      success: true,
      count: translations.length,
      translations: translations,
    });

  } catch (error) {
    console.error('Preload API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch translations',
      count: 0,
      translations: [],
    }, { status: 500 });
  }
}