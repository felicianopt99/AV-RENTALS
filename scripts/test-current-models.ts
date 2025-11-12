#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test current available models with correct naming
 */
async function testCurrentModels(): Promise<void> {
  console.log('🔍 Testing Current Available Models');
  console.log('===================================');
  
  const backupKey = "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw";
  
  // Current model names (updated for 2024/2025)
  const models = [
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',  
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest'
  ];
  
  for (const modelName of models) {
    console.log(`\n🧪 Testing ${modelName}:`);
    
    try {
      const genAI = new GoogleGenerativeAI(backupKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log('⚡ Sending simple test...');
      
      const result = await model.generateContent('Say "Hello" in Portuguese');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`📝 Response: "${text.trim()}"`);
      
      console.log(`🎯 SUCCESS! Working model found: ${modelName}`);
      return; // Exit on first success
      
    } catch (error: any) {
      console.log(`❌ ${modelName} failed: ${error.status || 'unknown'} - ${error.message.substring(0, 100)}...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🤔 All model variations failed');
  console.log('\n🔧 Let me try a different approach...');
  
  // Try with minimal request to see if API works at all
  try {
    console.log('\n🧪 Testing basic API connectivity...');
    const genAI = new GoogleGenerativeAI(backupKey);
    
    // Try to get model info or make any API call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${backupKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API is accessible!');
      console.log('📋 Available models:');
      if (data.models) {
        data.models.slice(0, 5).forEach((model: any) => {
          console.log(`   - ${model.name}`);
        });
      }
    } else {
      console.log(`❌ API not accessible: ${response.status} ${response.statusText}`);
    }
    
  } catch (error: any) {
    console.log(`❌ Basic API test failed: ${error.message}`);
  }
}

testCurrentModels().catch(console.error);