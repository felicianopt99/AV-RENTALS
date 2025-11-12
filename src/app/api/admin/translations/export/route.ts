import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/translations/export - Export translations to JSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const targetLang = searchParams.get('targetLang') || 'pt';
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const whereClause: any = { targetLang };
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const translations = await prisma.translation.findMany({
      where: whereClause,
      orderBy: { sourceText: 'asc' },
    });

    let exportData: any;
    let contentType: string;
    let filename: string;

    if (format === 'json') {
      exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalTranslations: translations.length,
          targetLanguage: targetLang,
          format: 'AV-RENTALS Translation Export v1.0',
        },
        translations: translations.map(t => ({
          id: t.id,
          sourceText: t.sourceText,
          translatedText: t.translatedText,
          category: t.category || 'general',
          status: t.status || 'approved',
          context: t.context,
          tags: t.tags || [],
          qualityScore: t.qualityScore || 100,
          usageCount: t.usageCount || 0,
          isAutoTranslated: t.isAutoTranslated || false,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      };
      contentType = 'application/json';
      filename = `translations_${targetLang}_${new Date().toISOString().split('T')[0]}.json`;
    } else if (format === 'csv') {
      // CSV format
      const headers = [
        'Source Text',
        'Translation',
        'Category',
        'Status', 
        'Quality Score',
        'Usage Count',
        'Auto Translated',
        'Context',
        'Tags',
        'Created At',
      ];
      
      const csvRows = [
        headers.join(','),
        ...translations.map(t => [
          `"${t.sourceText.replace(/"/g, '""')}"`,
          `"${t.translatedText.replace(/"/g, '""')}"`,
          t.category || 'general',
          t.status || 'approved',
          t.qualityScore || 100,
          t.usageCount || 0,
          t.isAutoTranslated || false,
          `"${(t.context || '').replace(/"/g, '""')}"`,
          `"${(t.tags || []).join(';')}"`,
          t.createdAt.toISOString(),
        ].join(',')),
      ];
      
      exportData = csvRows.join('\n');
      contentType = 'text/csv';
      filename = `translations_${targetLang}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Simple key-value format for import into other systems
      const keyValuePairs: Record<string, string> = {};
      translations.forEach(t => {
        keyValuePairs[t.sourceText] = t.translatedText;
      });
      
      exportData = keyValuePairs;
      contentType = 'application/json';
      filename = `translations_${targetLang}_keyvalue_${new Date().toISOString().split('T')[0]}.json`;
    }

    const response = new NextResponse(
      typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export translations' },
      { status: 500 }
    );
  }
}