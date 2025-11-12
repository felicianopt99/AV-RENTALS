#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

class AdvancedBatchTranslator {
  private prisma: PrismaClient;
  private apiKeys: string[];
  private models: any[];
  private keyUsage: Map<number, { count: number; lastUsed: number }>;
  private readonly MAX_REQUESTS_PER_KEY_PER_MINUTE = 2;
  private readonly BATCH_SIZE = 6; // 3 texts per key * 2 working keys
  private readonly DELAY_BETWEEN_BATCHES = 35000; // 35 seconds to be safe
  
  constructor() {
    this.prisma = new PrismaClient();
    // Only use working API keys (2 and 3 from previous tests)
    this.apiKeys = [
      'AIzaSyB43Ac2fZ6_u5BAO9NnigBK9bWl6u5wNl0', 
      'AIzaSyBK_nV7HGz2k_rdpIYodFbL5v4WAtMdPAQ'
    ];
    
    // Initialize models for each API key
    this.models = this.apiKeys.map(key => {
      const genAI = new GoogleGenerativeAI(key);
      return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    });
    
    // Track usage per key
    this.keyUsage = new Map();
    this.apiKeys.forEach((_, index) => {
      this.keyUsage.set(index, { count: 0, lastUsed: 0 });
    });
  }
  
  private async canUseKey(keyIndex: number): Promise<boolean> {
    const usage = this.keyUsage.get(keyIndex)!;
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // Reset count if more than a minute has passed
    if (now - usage.lastUsed > oneMinute) {
      usage.count = 0;
    }
    
    return usage.count < this.MAX_REQUESTS_PER_KEY_PER_MINUTE;
  }
  
  private getAvailableKeys(): number[] {
    const available: number[] = [];
    for (let i = 0; i < this.apiKeys.length; i++) {
      const usage = this.keyUsage.get(i)!;
      const now = Date.now();
      const oneMinute = 60 * 1000;
      
      // Reset count if more than a minute has passed
      if (now - usage.lastUsed > oneMinute) {
        usage.count = 0;
      }
      
      if (usage.count < this.MAX_REQUESTS_PER_KEY_PER_MINUTE) {
        available.push(i);
      }
    }
    return available;
  }
  
  private async translateWithKey(keyIndex: number, texts: string[]): Promise<string[]> {
    const usage = this.keyUsage.get(keyIndex)!;
    
    try {
      console.log(`  🔄 Key ${keyIndex + 1}: Translating ${texts.length} texts...`);
      
      // Create batch prompt for multiple texts
      const numberedTexts = texts.map((text, i) => `${i + 1}. "${text}"`).join('\n');
      const prompt = `Translate these ${texts.length} English texts to Portuguese. Keep the same numbering:

${numberedTexts}

Reply with only the numbered Portuguese translations, one per line.`;

      const result = await this.models[keyIndex].generateContent(prompt);
      const response = result.response.text().trim();
      
      // Parse the numbered response
      const lines = response.split('\n').filter((line: string) => line.trim());
      const translations: string[] = [];
      
      for (const line of lines) {
        const match = line.match(/^\d+\.\s*"?([^"]+)"?$/);
        if (match) {
          translations.push(match[1].trim());
        }
      }
      
      // Update usage tracking
      usage.count++;
      usage.lastUsed = Date.now();
      
      console.log(`  ✅ Key ${keyIndex + 1}: Got ${translations.length} translations`);
      return translations;
      
    } catch (error: any) {
      console.log(`  ❌ Key ${keyIndex + 1}: Error -`, error.message || String(error));
      
      // Mark key as overused if rate limited
      if (error.status === 429 || error.status === 503) {
        usage.count = this.MAX_REQUESTS_PER_KEY_PER_MINUTE;
        usage.lastUsed = Date.now();
      }
      
      return [];
    }
  }
  
  private async saveBatchTranslations(originalTexts: string[], translations: string[]): Promise<void> {
    const saves = [];
    
    for (let i = 0; i < Math.min(originalTexts.length, translations.length); i++) {
      const original = originalTexts[i];
      const translated = translations[i];
      
      if (translated && translated !== original) {
        saves.push(
          this.prisma.translation.upsert({
            where: {
              sourceText_targetLang: {
                sourceText: original,
                targetLang: 'pt'
              }
            },
            update: {
              translatedText: translated,
              updatedAt: new Date()
            },
            create: {
              sourceText: original,
              targetLang: 'pt',
              translatedText: translated,
              model: 'gemini-2.5-flash'
            }
          })
        );
      }
    }
    
    if (saves.length > 0) {
      await Promise.all(saves);
      console.log(`    💾 Saved ${saves.length} translations to database`);
    }
  }
  
  async processBatch(textsToTranslate: string[]): Promise<void> {
    console.log(`\n🚀 ADVANCED BATCH PROCESSING: ${textsToTranslate.length} texts`);
    console.log('='.repeat(60));
    
    let processedCount = 0;
    let successCount = 0;
    
    // Process in optimized batches
    for (let i = 0; i < textsToTranslate.length; i += this.BATCH_SIZE) {
      const batchTexts = textsToTranslate.slice(i, i + this.BATCH_SIZE);
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(textsToTranslate.length / this.BATCH_SIZE);
      
      console.log(`\n📦 Batch ${batchNumber}/${totalBatches}: Processing ${batchTexts.length} texts`);
      
      // Get available keys
      const availableKeys = this.getAvailableKeys();
      
      if (availableKeys.length === 0) {
        console.log('  ⏳ All keys rate-limited, waiting 65 seconds...');
        await new Promise(resolve => setTimeout(resolve, 65000));
        continue;
      }
      
      console.log(`  🔑 Available keys: ${availableKeys.length}/4`);
      
      // Distribute texts across available keys
      const keyBatches: { keyIndex: number; texts: string[] }[] = [];
      const textsPerKey = Math.ceil(batchTexts.length / availableKeys.length);
      
      for (let k = 0; k < availableKeys.length; k++) {
        const keyIndex = availableKeys[k];
        const start = k * textsPerKey;
        const end = Math.min(start + textsPerKey, batchTexts.length);
        const keyTexts = batchTexts.slice(start, end);
        
        if (keyTexts.length > 0) {
          keyBatches.push({ keyIndex, texts: keyTexts });
        }
      }
      
      // Execute translations in parallel across multiple keys
      const promises = keyBatches.map(async ({ keyIndex, texts }) => {
        const translations = await this.translateWithKey(keyIndex, texts);
        return { originalTexts: texts, translations };
      });
      
      try {
        const results = await Promise.all(promises);
        
        // Save all successful translations
        for (const { originalTexts, translations } of results) {
          if (translations.length > 0) {
            await this.saveBatchTranslations(originalTexts, translations);
            successCount += translations.length;
          }
          processedCount += originalTexts.length;
        }
        
        console.log(`  📊 Batch result: ${successCount}/${processedCount} successful translations`);
        
      } catch (error) {
        console.log(`  ❌ Batch error:`, error);
      }
      
      // Wait between batches to respect rate limits
      if (i + this.BATCH_SIZE < textsToTranslate.length) {
        console.log(`  ⏳ Waiting ${this.DELAY_BETWEEN_BATCHES/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_BATCHES));
      }
    }
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ Successfully translated: ${successCount}`);
    console.log(`📦 Total processed: ${processedCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount/processedCount)*100)}%`);
  }
}

async function main() {
  try {
    // Load optimized queue (if available) or fallback to missing translations
    let textsToProcess: string[] = [];
    
    const optimizedPath = path.join(process.cwd(), 'optimized-translation-queue.json');
    const missingPath = path.join(process.cwd(), 'missing-translations.json');
    
    if (fs.existsSync(optimizedPath)) {
      console.log('📊 Using optimized translation queue');
      const optimized = JSON.parse(fs.readFileSync(optimizedPath, 'utf-8'));
      textsToProcess = optimized.queue;
    } else if (fs.existsSync(missingPath)) {
      console.log('📋 Using basic missing translations list');
      const missing = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));
      textsToProcess = [
        ...missing.criticalTexts.slice(0, 150),
        ...missing.missingTexts.filter((text: string) => 
          !missing.criticalTexts.includes(text) && 
          text.length < 50
        ).slice(0, 50)
      ];
    } else {
      console.log('❌ Run find-missing-translations.ts or optimize-batch-queue.ts first');
      return;
    }
    
    console.log(`🎯 Processing ${textsToProcess.length} prioritized texts with 4 API keys`);
    
    const translator = new AdvancedBatchTranslator();
    await translator.processBatch(textsToProcess);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();