#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test each API key individually
 */
async function testIndividualKeys(): Promise<void> {
  console.log('🔍 Testing Each API Key Individually');
  console.log('====================================');
  
  const primaryKey = "AIzaSyC6qWeqkyQLQLefQDkLffEt9OhQ24LEiuk";
  const backupKey = "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw";
  const backupKey2 = "AIzaSyCT1u6CRPw3TVcOZmNfDzKD8D0WidGreis";
  
  const keys = [
    { name: 'Primary Key', key: primaryKey },
    { name: 'Backup Key', key: backupKey },
    { name: 'Backup Key 2', key: backupKey2 }
  ];
  
  for (const { name, key } of keys) {
    console.log(`\n🧪 Testing ${name}:`);
    console.log(`🔑 Key: ${key.substring(0, 20)}...`);
    
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      console.log('⚡ Sending test request...');
      
      const result = await model.generateContent('Translate "Hello" to Portuguese:');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${name} is working!`);
      console.log(`📝 Response: "${text.trim()}"`);
      
    } catch (error: any) {
      console.log(`❌ ${name} failed:`);
      console.log(`📋 Status: ${error.status || 'unknown'}`);
      console.log(`📋 Error: ${error.message}`);
      
      if (error.status === 429) {
        console.log('⚠️  This key is quota exhausted');
      } else if (error.status === 400) {
        console.log('⚠️  Bad request - check key validity');
      } else if (error.status === 401) {
        console.log('⚠️  Authentication failed - invalid key');
      }
    }
  }
}

// Run the test
testIndividualKeys().catch(console.error);