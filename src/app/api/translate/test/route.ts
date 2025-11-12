import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Check if API key is loaded
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Google AI API key not found in environment variables',
        apiKeyPresent: false,
      }, { status: 500 });
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for fast translations
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      }
    });

    // Test a simple generation
    const result = await model.generateContent('Say "Translation system is working!" in Portuguese (Portugal)');
    const response = result.response.text();

    return NextResponse.json({
      status: 'success',
      message: 'Google AI is configured correctly',
      apiKeyPresent: true,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      testResponse: response,
    });
  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      apiKeyPresent: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }, { status: 500 });
  }
}
