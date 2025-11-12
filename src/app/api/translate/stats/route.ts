import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get total count
    const totalCount = await prisma.translation.count();
    
    // Get count by language
    const byLanguage = await prisma.translation.groupBy({
      by: ['targetLang'],
      _count: true,
    });
    
    // Get recent translations
    const recentTranslations = await prisma.translation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        sourceText: true,
        translatedText: true,
        targetLang: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      totalTranslations: totalCount,
      byLanguage: byLanguage.map(item => ({
        language: item.targetLang,
        count: item._count,
      })),
      recentTranslations,
      message: `Database contains ${totalCount} permanent translations shared across all users`,
    });
  } catch (error) {
    console.error('Translation stats error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
