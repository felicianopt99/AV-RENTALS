import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { useTranslate } from '@/contexts/TranslationContext';
export async function GET() {
  // Translation hooks
  const { translated: toastFastandefficienDescText } = useTranslate('Fast and efficient model for translation');

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not configured'
      }, { status: 500 });
    }

    // Return known working models based on our testing
    const models = [
      {
        name: 'models/gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        description: '{toastFastandefficienDescText}',
        supportedGenerationMethods: ['generateContent'],
      }
    ];
    
    return NextResponse.json({
      status: 'success',
      models
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
