#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test different models with backup key
 */
async function testDifferentModels(): Promise<void> {
  console.log('🔍 Testing Different Models with Backup Key');
  console.log('============================================');
  
  const backupKey = "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw";
  
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-8b'
  ];
  
  for (const modelName of models) {
    console.log(`\n🧪 Testing model: ${modelName}`);
    
    try {
      const genAI = new GoogleGenerativeAI(backupKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log('⚡ Sending test request...');
      
      const result = await model.generateContent('Translate "Hello" to Portuguese:');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} is working!`);
      console.log(`📝 Response: "${text.trim()}"`);
      return; // Success! Exit early
      
    } catch (error: any) {
      console.log(`❌ ${modelName} failed:`);
      console.log(`📋 Status: ${error.status || 'unknown'}`);
      
      if (error.status === 429) {
        console.log('⚠️  Quota exhausted');
      } else if (error.status === 400) {
        console.log('⚠️  Bad request or model not available');
      } else if (error.status === 404) {
        console.log('⚠️  Model not found');
      } else {
        console.log(`📋 Error: ${error.message.substring(0, 200)}...`);
      }
    }
  }
  
  console.log('\n❌ All models failed with backup key');
}

// Run the test
testDifferentModels().catch(console.error);