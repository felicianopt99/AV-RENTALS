#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { translateText } from '../src/lib/translation.js';
import fs from 'fs';
import path from 'path';

async function efficientBatchTranslate() {
  console.log('🚀 EFFICIENT BATCH TRANSLATION');
  console.log('==============================');
  
  const prisma = new PrismaClient();
  
  try {
    // Load optimized queue
    const optimizedPath = path.join(process.cwd(), 'optimized-translation-queue.json');
    if (!fs.existsSync(optimizedPath)) {
      console.log('❌ Run optimize-batch-queue.ts first');
      return;
    }
    
    const optimized = JSON.parse(fs.readFileSync(optimizedPath, 'utf-8'));
    
    // Take top 50 most important texts for focused processing
    const priorityTexts = optimized.queue.slice(0, 50);
    
    console.log(`🎯 Processing top ${priorityTexts.length} priority texts`);
    console.log('Using working API keys with conservative rate limits');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < priorityTexts.length; i++) {
      const text = priorityTexts[i];
      
      try {
        console.log(`\n📝 ${i + 1}/${priorityTexts.length}: "${text}"`);
        
        // Check if already translated
        const existing = await prisma.translation.findFirst({
          where: {
            sourceText: text,
            targetLang: 'pt'
          }
        });
        
        if (existing) {
          console.log(`  ⚡ Already translated: "${existing.translatedText}"`);
          skipCount++;
          continue;
        }
        
        // Translate using our smart system
        const translated = await translateText(text, 'pt');
        
        if (translated && translated !== text) {
          console.log(`  ✅ "${text}" → "${translated}"`);
          successCount++;
        } else {
          console.log(`  ⚠️ No translation returned`);
        }
        
        // Conservative delay between requests
        if (i < priorityTexts.length - 1) {
          console.log(`  ⏳ Waiting 3s...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.log(`  ❌ Error:`, error instanceof Error ? error.message : String(error));
        
        // Longer delay on error
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Final status
    const finalCount = await prisma.translation.count();
    
    console.log(`\n📊 PROCESSING COMPLETE:`);
    console.log(`✅ New translations: ${successCount}`);
    console.log(`⚡ Already translated: ${skipCount}`);
    console.log(`📈 Total translations in database: ${finalCount}`);
    console.log(`🎯 Processing rate: ${successCount}/${priorityTexts.length - skipCount} new texts`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

efficientBatchTranslate();