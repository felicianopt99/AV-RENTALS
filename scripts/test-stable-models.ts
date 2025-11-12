#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test stable models with backup key
 */
async function testStableModels(): Promise<void> {
  console.log('🔍 Testing Stable Models with Backup Key');
  console.log('========================================');
  
  const backupKey = "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw";
  
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'text-bison-001'
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
      } else if (error.status === 403) {
        console.log('⚠️  Permission denied');
      } else {
        console.log(`📋 Error: ${error.message.substring(0, 150)}...`);
      }
    }
  }
  
  console.log('\n❌ All stable models failed too');
  console.log('\n💡 Possible issues:');
  console.log('   - Both keys from same Google account/project');
  console.log('   - Free tier completely exhausted for account');
  console.log('   - Need to upgrade to paid tier');
  console.log('   - Try keys from different Google account');
}

// Run the test
testStableModels().catch(console.error);