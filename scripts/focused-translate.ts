#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const prisma = new PrismaClient();

// API Keys
const API_KEYS = [
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  "AIzaSyAN8yv7LMnZgUMTZekHDP5KKRsgBGqcXTw", // Backup key
  "AIzaSyCT1u6CRPw3TVcOZmNfDzKD8D0WidGreis", // Third key
  "AIzaSyB43Ac2fZ6_u5BAO9NnigBK9bWl6u5wNl0"  // Fourth key
];

let currentKeyIndex = 0;
let requestCount = 0;
let requestResetTime = Date.now() + 60000;
const MAX_REQUESTS_PER_MINUTE = 5; // Conservative limit

function getModel() {
  const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    }
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkRateLimit() {
  const now = Date.now();
  
  if (now >= requestResetTime) {
    requestCount = 0;
    requestResetTime = now + 60000;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = requestResetTime - now;
    console.log(`⏰ Rate limit reached. Waiting ${Math.ceil(waitTime/1000)}s...`);
    await sleep(waitTime + 1000);
    requestCount = 0;
    requestResetTime = Date.now() + 60000;
  }
}

function isValidUIText(text: string): boolean {
  return (
    text.length > 1 &&
    text.length < 200 &&
    !text.includes('${') &&
    !text.includes('(') &&
    !text.includes('{') &&
    !text.includes('=') &&
    !text.includes('function') &&
    !text.includes('class') &&
    !text.includes('import') &&
    !text.includes('export') &&
    !text.includes('const') &&
    !text.includes('let') &&
    !text.includes('var') &&
    !text.includes('http') &&
    !text.includes('.ts') &&
    !text.includes('.js') &&
    !text.includes('©') &&
    !text.includes('®') &&
    !text.includes('™') &&
    !text.startsWith('#') &&
    !text.startsWith('/*') &&
    !text.startsWith('//') &&
    !text.startsWith('./') &&
    !/^\d+$/.test(text) &&
    !/^[A-Z_]+$/.test(text) &&
    !/^[a-z]+\.[a-z]+/.test(text) &&
    !/^\d+\s*&&/.test(text) &&
    !/Promise/.test(text) &&
    !text.includes('&&') &&
    !text.includes('||') &&
    text.trim().length > 0 &&
    // Keep common UI texts
    (/^[A-Za-z\s\-\.!?\(\)]+$/.test(text) || 
     text.includes(' ') || 
     text.length <= 20)
  );
}

async function translateText(text: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await checkRateLimit();
      
      const model = getModel();
      const prompt = `Translate the following text to Portuguese (European Portugal variant, not Brazilian).
Keep any technical terms, brand names, and formatting intact.
Only return the translated text, nothing else.

Text to translate: "${text}"`;

      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      requestCount++;
      
      return translated;
      
    } catch (error: any) {
      console.log(`⚠️  Attempt ${attempt + 1} failed for "${text}":`, error.message.substring(0, 100));
      
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        console.log('🔄 Switching to backup API key...');
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        await sleep(5000); // Wait 5 seconds before retry
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        console.log('💤 Quota exceeded, waiting 60 seconds...');
        await sleep(60000);
      } else {
        await sleep(2000);
      }
    }
  }
  
  console.log(`❌ Failed to translate after 3 attempts: "${text}"`);
  return text; // Return original if translation fails
}

async function main() {
  try {
    console.log('🚀 FOCUSED UI TRANSLATION');
    console.log('=========================');
    
    // Read extracted UI texts
    const extractedData = JSON.parse(fs.readFileSync('/home/feli/AV-RENTALS/extracted-ui-texts.json', 'utf8'));
    const allTexts = extractedData.texts;
    
    // Get existing translations
    const existingTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt' },
      select: { sourceText: true }
    });
    
    const translatedTexts = new Set(existingTranslations.map(t => t.sourceText));
    
    // Find valid UI texts that need translation
    const missingTexts = allTexts.filter((text: string) => 
      !translatedTexts.has(text) && isValidUIText(text)
    );
    
    console.log(`📝 Found ${missingTexts.length} UI texts needing translation`);
    
    if (missingTexts.length === 0) {
      console.log('🎉 All UI texts are already translated!');
      return;
    }
    
    console.log('📋 Starting translation...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < Math.min(missingTexts.length, 50); i++) { // Limit to 50 for this run
      const text = missingTexts[i];
      console.log(`[${i + 1}/${Math.min(missingTexts.length, 50)}] "${text}"`);
      
      const translated = await translateText(text);
      
      if (translated !== text) {
        // Save to database
        try {
          await prisma.translation.create({
            data: {
              sourceText: text,
              targetLang: 'pt',
              translatedText: translated,
              model: 'gemini-2.5-flash',
            },
          });
          console.log(`  ✅ → "${translated}"\n`);
          successCount++;
        } catch (dbError: any) {
          if (dbError.code === 'P2002') {
            console.log(`  ✓ Already exists in database\n`);
          } else {
            console.log(`  ❌ Database error: ${dbError.message}\n`);
            errorCount++;
          }
        }
      } else {
        console.log(`  ⚠️  Translation failed, skipping\n`);
        errorCount++;
      }
      
      // Small delay between translations
      await sleep(1000);
    }
    
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Successfully translated: ${successCount}`);
    console.log(`❌ Failed/skipped: ${errorCount}`);
    console.log(`📝 Remaining texts: ${Math.max(0, missingTexts.length - 50)}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);