import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearTranslationCache } from '@/lib/translation';

interface TranslationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  averageQuality: number;
  needsReview: number;
  autoTranslated: number;
  totalUsage: number;
}

// GET /api/admin/translations - Enhanced translations with full feature set
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const targetLang = searchParams.get('targetLang') || 'pt';
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: any = {
      targetLang,
    };
    
    if (search) {
      whereClause.OR = [
        { sourceText: { contains: search, mode: 'insensitive' } },
        { translatedText: { contains: search, mode: 'insensitive' } },
        { context: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get translations with pagination
    const [translations, totalCount] = await Promise.all([
      prisma.translation.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.translation.count({ where: whereClause }),
    ]);
    
    // Calculate comprehensive stats
    const allTranslations = await prisma.translation.findMany({
      where: { targetLang },
      select: {
        status: true,
        category: true,
        qualityScore: true,
        needsReview: true,
        isAutoTranslated: true,
        usageCount: true,
      },
    });

    // Build enhanced stats
    const byStatus = allTranslations.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = allTranslations.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats: TranslationStats = {
      total: totalCount,
      byStatus,
      byCategory,
      averageQuality: allTranslations.length > 0 
        ? Math.round(allTranslations.reduce((sum, t) => sum + t.qualityScore, 0) / allTranslations.length)
        : 100,
      needsReview: allTranslations.filter(t => t.needsReview).length,
      autoTranslated: allTranslations.filter(t => t.isAutoTranslated).length,
      totalUsage: allTranslations.reduce((sum, t) => sum + t.usageCount, 0),
    };
    
    return NextResponse.json({
      translations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats,
    });
    
  } catch (error) {
    console.error('Admin translations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/translations - Create new translation with enhanced features when available
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sourceText, 
      translatedText, 
      targetLang = 'pt',
      // Enhanced fields (optional for backward compatibility)
      category = 'general',
      context,
      tags = [],
    } = body;
    
    if (!sourceText || !translatedText) {
      return NextResponse.json(
        { error: 'sourceText and translatedText are required' },
        { status: 400 }
      );
    }
    
    // Check for duplicates
    const existing = await prisma.translation.findUnique({
      where: {
        sourceText_targetLang: {
          sourceText,
          targetLang
        }
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Translation for this text already exists' },
        { status: 409 }
      );
    }
    
    // Create with basic fields (enhanced fields will be added when schema is migrated)
    const translationData: any = {
      sourceText,
      translatedText,
      targetLang,
    };
    
    // Add enhanced fields if they exist in schema
    try {
      if (category) translationData.category = category;
      if (context) translationData.context = context;
      if (tags && tags.length > 0) translationData.tags = tags;
    } catch (e) {
      // Enhanced fields not available yet, continue with basic creation
    }
    
    const translation = await prisma.translation.create({
      data: translationData,
    });
    // Invalidate cache so new translation is visible immediately
    clearTranslationCache();
    
    return NextResponse.json({ translation });
    
  } catch (error) {
    console.error('Create translation error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Translation for this text already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create translation' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/translations - Bulk update translations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Translation IDs are required' },
        { status: 400 }
      );
    }

    // Prepare update data with enhanced fields
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
      version: { increment: 1 },
    };

    const updated = await prisma.translation.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });
    // Invalidate in-memory cache so bulk updates reflect immediately
    clearTranslationCache();
    
    return NextResponse.json({
      updated: updated.count,
      message: `Updated ${updated.count} translation(s)`,
    });
    
  } catch (error) {
    console.error('Bulk update translations error:', error);
    return NextResponse.json(
      { error: 'Failed to update translations' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/translations - Delete translation(s)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',');
    
    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Translation IDs are required' },
        { status: 400 }
      );
    }
    
    const deleted = await prisma.translation.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    // Invalidate in-memory cache so deletions reflect immediately
    clearTranslationCache();
    
    return NextResponse.json({
      deleted: deleted.count,
      message: `Deleted ${deleted.count} translation(s)`,
    });
    
  } catch (error) {
    console.error('Delete translations error:', error);
    return NextResponse.json(
      { error: 'Failed to delete translations' },
      { status: 500 }
    );
  }
}