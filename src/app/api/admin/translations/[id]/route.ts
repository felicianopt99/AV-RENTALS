import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearTranslationCache } from '@/lib/translation';

// GET /api/admin/translations/[id] - Get specific translation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid translation ID' },
        { status: 400 }
      );
    }

    const translation = await prisma.translation.findUnique({
      where: { id },
    });
    
    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ translation });
    
  } catch (error) {
    console.error('Get translation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/translations/[id] - Update specific translation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      translatedText,
      status,
      qualityScore,
      category,
      tags,
      needsReview,
      changeReason,
    } = body || {};
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid translation ID' },
        { status: 400 }
      );
    }
    
    if (!translatedText && !status && qualityScore == null && !category && !tags && needsReview == null) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Fetch previous for history
    const prev = await prisma.translation.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ error: 'Translation not found' }, { status: 404 });

    const data: any = { updatedAt: new Date(), version: { increment: 1 } };
    if (translatedText != null) data.translatedText = translatedText;
    if (status) data.status = status;
    if (qualityScore != null) data.qualityScore = qualityScore;
    if (category) data.category = category;
    if (Array.isArray(tags)) data.tags = tags;
    if (needsReview != null) data.needsReview = needsReview;

    const translation = await prisma.translation.update({ where: { id }, data });
    // Invalidate in-memory cache so updated translation is picked up immediately
    clearTranslationCache();

    // Create history entry (best-effort)
    try {
      await prisma.translationHistory.create({
        data: {
          translationId: id,
          oldTranslatedText: prev.translatedText,
          newTranslatedText: translation.translatedText,
          changeReason: changeReason || null,
          version: (translation as any).version || ((prev as any).version || 1),
        },
      });
    } catch {}

    return NextResponse.json({ translation });
    
  } catch (error) {
    console.error('Update translation error:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/translations/[id] - Delete specific translation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid translation ID' },
        { status: 400 }
      );
    }
    
    await prisma.translation.delete({
      where: { id },
    });
    // Invalidate in-memory cache so deletion is reflected
    clearTranslationCache();
    
    return NextResponse.json({
      message: 'Translation deleted successfully',
    });
    
  } catch (error) {
    console.error('Delete translation error:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete translation' },
      { status: 500 }
    );
  }
}