#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Check Google AI API quota status
 */
async function checkAPIQuota(): Promise<void> {
  console.log('🧪 Checking Google AI API Quota Status');
  console.log('======================================');
  
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ API key not found in environment variables');
    console.log('💡 Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY');
    return;
  }

  console.log('🔑 API key found');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('⚡ Testing API connection...');
    
    const result = await model.generateContent('Translate "Hello" to Portuguese:');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API quota is available!');
    console.log(`📝 Test response: "${text}"`);
    console.log('🚀 Ready to run smart-retry.ts');
    
  } catch (error: any) {
    if (error.status === 429) {
      console.log('❌ API quota exhausted (429 error)');
      console.log('⏰ Quota typically resets within 24 hours');
      console.log('💡 Try again later or upgrade to paid tier');
    } else if (error.status === 400) {
      console.log('⚠️  API request error (400)');
      console.log(`📋 Details: ${error.message}`);
    } else if (error.status === 401) {
      console.log('🔐 API key authentication failed (401)');
      console.log('💡 Check if your API key is valid');
    } else {
      console.log(`💥 API error (${error.status || 'unknown'})`);
      console.log(`📋 Message: ${error.message}`);
    }
    
    console.log('\n🛠️  Troubleshooting:');
    console.log('1. Check API key validity at https://aistudio.google.com/app/apikey');
    console.log('2. Verify quota limits at https://console.cloud.google.com/');
    console.log('3. Consider upgrading to paid tier for higher limits');
  }
}

// Run the check
checkAPIQuota().catch(console.error);