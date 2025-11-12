#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Import the translation function from our library
import { translateText } from '../src/lib/translation.js';

async function translateMissingTexts() {
  console.log('🚀 BATCH TRANSLATE MISSING UI TEXTS');
  console.log('===================================');
  
  const prisma = new PrismaClient();
  
  try {
    // Read the missing translations
    const missingPath = path.join(process.cwd(), 'missing-translations.json');
    if (!fs.existsSync(missingPath)) {
      console.log('❌ No missing-translations.json found. Run find-missing-translations.ts first.');
      return;
    }
    
    const missing = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));
    console.log(`📊 Processing ${missing.totalMissing} missing texts`);
    console.log(`🚨 ${missing.criticalCount} critical texts identified`);
    
    // Prioritize critical texts first
    const textsToTranslate = [
      ...missing.criticalTexts.slice(0, 50), // First 50 critical texts
      ...missing.missingTexts.filter((text: string) => 
        !missing.criticalTexts.includes(text)
      ).slice(0, 30) // Then 30 additional texts
    ];
    
    console.log(`\n🎯 Translating ${textsToTranslate.length} prioritized texts...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process in small batches to respect rate limits
    const batchSize = 5; // Conservative batch size
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      
      console.log(`\n📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(textsToTranslate.length/batchSize)}: Processing ${batch.length} texts...`);
      
      for (const text of batch) {
        try {
          console.log(`  🔄 Translating: "${text}"`);
          
          // Use our translation system
          const translated = await translateText(text, 'pt');
          
          if (translated && translated !== text) {
            console.log(`  ✅ "${text}" → "${translated}"`);
            successCount++;
          } else {
            console.log(`  ⚠️  "${text}" → No translation (cached or unchanged)`);
          }
          
        } catch (error) {
          console.log(`  ❌ Error translating "${text}":`, error instanceof Error ? error.message : String(error));
          errorCount++;
        }
        
        // Small delay between translations
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Longer delay between batches
      if (i + batchSize < textsToTranslate.length) {
        console.log(`  ⏳ Waiting 10s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('\n📊 TRANSLATION RESULTS');
    console.log('=====================');
    console.log(`✅ Successful translations: ${successCount}`);
    console.log(`❌ Failed translations: ${errorCount}`);
    console.log(`📦 Total processed: ${textsToTranslate.length}`);
    
    // Check final translation count
    const finalCount = await prisma.translation.count();
    console.log(`📈 Total translations now: ${finalCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

translateMissingTexts();