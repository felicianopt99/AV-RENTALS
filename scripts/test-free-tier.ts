#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test free tier compatible models
 */
async function testFreeTierModels(): Promise<void> {
  console.log('🆓 Testing Free Tier Compatible Models');
  console.log('======================================');
  
  const backupKey = "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw";
  
  // Free tier models (as of 2024/2025)
  const freeTierModels = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.0-pro'
  ];
  
  for (const modelName of freeTierModels) {
    console.log(`\n🧪 Testing ${modelName}:`);
    
    try {
      const genAI = new GoogleGenerativeAI(backupKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log('⚡ Sending test request...');
      
      const result = await model.generateContent('Translate "Hello" to Portuguese:');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`📝 Response: "${text.trim()}"`);
      
      // Test a small batch translation
      console.log('🔄 Testing batch translation...');
      const batchResult = await model.generateContent(`Translate these to Portuguese:
1. Save
2. Cancel
3. Delete
4. Edit

Portuguese translations:`);
      const batchResponse = await batchResult.response;
      const batchText = batchResponse.text();
      
      console.log(`✅ Batch translation works: "${batchText.trim()}"`);
      
      console.log(`🎯 FOUND WORKING MODEL: ${modelName}`);
      return; // Success! Exit early
      
    } catch (error: any) {
      console.log(`❌ ${modelName} failed:`);
      console.log(`📋 Status: ${error.status || 'unknown'}`);
      
      if (error.status === 429) {
        console.log('⚠️  Quota exhausted');
        
        // Check if it's a rate limit or quota exhaustion
        if (error.message.includes('limit: 0')) {
          console.log('💀 Hard quota limit (0) - account/project issue');
        } else {
          console.log('⏰ Rate limit - might work after delay');
        }
      } else if (error.status === 404) {
        console.log('⚠️  Model not found in free tier');
      } else if (error.status === 403) {
        console.log('⚠️  API not enabled or key restricted');
      } else {
        console.log(`📋 Error: ${error.message.substring(0, 150)}...`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n❌ No free tier models worked');
  console.log('\n💡 Troubleshooting steps:');
  console.log('1. Visit https://aistudio.google.com/app/apikey');
  console.log('2. Ensure API key is from a project with:');
  console.log('   - Generative Language API enabled');
  console.log('   - Free tier quota available');
  console.log('   - No API restrictions blocking requests');
  console.log('3. Try creating a fresh API key in AI Studio');
}

testFreeTierModels().catch(console.error);