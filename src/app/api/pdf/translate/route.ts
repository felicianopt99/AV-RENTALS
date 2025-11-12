// src/app/api/pdf/translate/route.ts
// API endpoint for PDF-specific translations
import { NextRequest, NextResponse } from 'next/server';
import { pdfTranslationService } from '@/lib/pdf-translation';
import { Language } from '@/lib/translation';
import { z } from 'zod';

const pdfTranslationSchema = z.object({
  targetLang: z.enum(['en', 'pt']),
  dynamicContent: z.object({
    equipmentNames: z.array(z.string()).optional(),
    serviceNames: z.array(z.string()).optional(), 
    feeNames: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).optional(),
  compact: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetLang, dynamicContent, compact } = pdfTranslationSchema.parse(body);
    
    // Get translated PDF texts
    const translatedTexts = await pdfTranslationService.getTranslatedPDFTexts(
      targetLang as Language,
      dynamicContent,
      compact
    );
    
    return NextResponse.json({
      success: true,
      data: translatedTexts,
      language: targetLang
    });
    
  } catch (error) {
    console.error('PDF translation API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to translate PDF content',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}