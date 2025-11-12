import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not found');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // The GoogleAIFileManager is a new addition that can help list models.
    // However, a simpler way is to just try and get a model and see what the error is.
    // A more robust way for this specific problem is needed.
    // Let's try to get the model list from the API.
    // The SDK doesn't have a direct `listModels` function, so we have to be creative.
    // Let's try to fetch the models list directly.

    const listModelsUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    const response = await fetch(`${listModelsUrl}?key=${apiKey}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch model list from Google AI.',
        details: data,
      }, { status: response.status });
    }

    const modelNames = data.models.map((m: any) => m.name);
    const supportedModels = data.models
      .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          description: m.description,
          version: m.version,
      }));


    return NextResponse.json({
      status: 'success',
      message: 'Successfully fetched available models.',
      allModelNames: modelNames,
      supportedModels: supportedModels,
    });

  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
