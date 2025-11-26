import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearTranslationCache } from '@/lib/translation';

// POST /api/admin/translations/seed - Bulk seed translations from raw texts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texts, targetLang = 'pt', category = 'general' } = body || {};

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts must be a non-empty array' }, { status: 400 });
    }

    // Prepare createMany payload
    const data = texts.map((t: string) => ({
      sourceText: t,
      translatedText: t, // seed with original text; can be edited later
      targetLang,
      category,
      model: 'seed',
      status: 'draft',
    }));

    const result = await prisma.translation.createMany({ data, skipDuplicates: true });

    clearTranslationCache();

    return NextResponse.json({ created: result.count });
  } catch (error) {
    console.error('Seed translations error:', error);
    return NextResponse.json({ error: 'Failed to seed translations' }, { status: 500 });
  }
}
