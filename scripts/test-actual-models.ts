#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test the actual available models
 */
async function testActualModels(): Promise<void> {
  console.log('🎯 Testing Actual Available Models');
  console.log('==================================');
  
  const backupKey = "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw";
  
  // Actual available models from API response
  const actualModels = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-flash-preview-05-20',
    'models/gemini-2.5-pro-preview-03-25',
    'models/gemini-2.5-flash-lite-preview-06-17'
  ];
  
  for (const modelName of actualModels) {
    console.log(`\n🧪 Testing ${modelName}:`);
    
    try {
      const genAI = new GoogleGenerativeAI(backupKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log('⚡ Sending translation test...');
      
      const result = await model.generateContent('Translate "Hello" to Portuguese:');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`📝 Response: "${text.trim()}"`);
      
      // Test batch translation
      console.log('🔄 Testing batch translation...');
      const batchResult = await model.generateContent(`Translate these English texts to Portuguese European (pt-PT):

1. Save
2. Cancel  
3. Delete
4. Loading...

Portuguese translations:`);
      
      const batchResponse = await batchResult.response;
      const batchText = batchResponse.text();
      
      console.log(`✅ Batch translation successful!`);
      console.log(`📝 Batch result:\n${batchText.trim()}`);
      
      console.log(`\n🎉 SUCCESS! Working model: ${modelName}`);
      console.log('🚀 Ready to update smart-retry.ts with this model!');
      return;
      
    } catch (error: any) {
      console.log(`❌ ${modelName} failed:`);
      console.log(`📋 Status: ${error.status || 'unknown'}`);
      
      if (error.status === 429) {
        console.log('⚠️  Quota/rate limit issue');
        if (error.message.includes('limit: 0')) {
          console.log('💀 Hard quota exhausted');
        } else {
          console.log('⏰ Rate limit - temporary');
        }
      } else {
        console.log(`📋 Error: ${error.message.substring(0, 200)}...`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n❌ All actual models failed');
}

testActualModels().catch(console.error);