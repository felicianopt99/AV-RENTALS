#!/usr/bin/env tsx

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Deep investigation of API key status
 */
async function investigateAPIKeys(): Promise<void> {
  console.log('🔍 Deep Investigation of API Key Status');
  console.log('======================================');
  
  const keys = [
    { name: 'Primary', key: "AIzaSyC6qWeqkyQLQLefQDkLffEt9OhQ24LEiuk" },
    { name: 'Backup', key: "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw" },
    { name: 'Third', key: "AIzaSyCT1u6CRPw3TVcOZmNfDzKD8D0WidGreis" },
    { name: 'Fourth', key: "AIzaSyB43Ac2fZ6_u5BAO9NnigBK9bWl6u5wNl0" }
  ];
  
  for (const { name, key } of keys) {
    console.log(`\n🧪 Testing ${name} Key:`);
    console.log(`🔑 Key: ${key.substring(0, 15)}...${key.substring(key.length - 4)}`);
    
    try {
      const genAI = new GoogleGenerativeAI(key);
      
      // Try the simplest stable model first
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      console.log('⚡ Testing with gemini-2.5-flash model...');
      
      const result = await model.generateContent('Hello');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${name} key WORKS!`);
      console.log(`📝 Response: "${text.trim()}"`);
      
      // Test rate limit by making another call
      console.log('🔄 Testing second call for rate limits...');
      const result2 = await model.generateContent('Test');
      const response2 = await result2.response;
      const text2 = response2.text();
      
      console.log(`✅ Second call also works: "${text2.trim()}"`);
      
    } catch (error: any) {
      console.log(`❌ ${name} key failed:`);
      console.log(`📋 Status: ${error.status}`);
      console.log(`📋 Error type: ${error.constructor.name}`);
      
      // Parse the detailed error
      if (error.message.includes('quota')) {
        console.log('⚠️  QUOTA ISSUE DETECTED');
        
        // Extract quota metrics
        const quotaMatch = error.message.match(/Quota exceeded for metric: ([^,]+)/g);
        if (quotaMatch) {
          console.log('📊 Quota metrics:');
          quotaMatch.forEach((metric: string) => console.log(`   - ${metric}`));
        }
        
        // Extract limits
        const limitMatch = error.message.match(/limit: (\d+)/g);
        if (limitMatch) {
          console.log('📉 Limits:');
          limitMatch.forEach((limit: string) => console.log(`   - ${limit}`));
        }
        
        // Extract retry delay
        const retryMatch = error.message.match(/Please retry in ([\d.]+)s/);
        if (retryMatch) {
          console.log(`⏰ Retry in: ${retryMatch[1]} seconds`);
        }
        
      } else if (error.status === 400) {
        console.log('⚠️  BAD REQUEST - possibly invalid model or key');
      } else if (error.status === 401) {
        console.log('⚠️  AUTHENTICATION FAILED - invalid API key');
      } else if (error.status === 403) {
        console.log('⚠️  FORBIDDEN - API might not be enabled for this project');
      } else {
        console.log(`⚠️  OTHER ERROR: ${error.message.substring(0, 200)}`);
      }
    }
    
    // Small delay between key tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🤔 Analysis:');
  console.log('If all keys from different accounts show same quota errors:');
  console.log('1. Keys might be from projects without billing enabled');
  console.log('2. Generative Language API not enabled on projects');
  console.log('3. Keys might have restrictions preventing API access');
  console.log('4. Free tier exhausted globally (unlikely for different accounts)');
  console.log('\n💡 Next steps:');
  console.log('- Check https://console.cloud.google.com/ for each project');
  console.log('- Verify billing is enabled');
  console.log('- Ensure Generative Language API is enabled');
  console.log('- Check API key restrictions');
}

investigateAPIKeys().catch(console.error);