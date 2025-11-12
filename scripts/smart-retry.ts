#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { shouldTranslateText } from '../src/lib/translationRules';

/**
 * Smart Translation Retry
 * Only translates actual UI text, skips protected content
 */

class SmartTranslationRetry {
  private prisma: PrismaClient;
  private apiKeys: string[];
  private models: any[]; // Array of models for parallel processing
  private targetLanguage = 'pt-PT';
  private batchSize = 3; // Much smaller batches to prevent overload
  private parallelBatches = 2; // Reduced parallel processing
  private rateLimitDelay = 15000; // 15 seconds between rounds (more conservative)
  private requestsPerMinute = 2; // Free tier limit: 2 requests/minute
  private dailyRequestsPerKey = 250; // Daily limit per key
  private keyUsageCount: Map<string, number> = new Map(); // Track usage per key
  private lastRequestTime: Map<string, number> = new Map(); // Track last request time per key

  constructor() {
    this.prisma = new PrismaClient();
    
    // Load multiple API keys
    const primaryKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const backupKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY_BACKUP;
    const thirdKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY_THIRD;
    const fourthKey = "AIzaSyB43Ac2fZ6_u5BAO9NnigBK9bWl6u5wNl0";
    
    this.apiKeys = [primaryKey, backupKey, thirdKey, fourthKey].filter(Boolean) as string[];
    
    if (this.apiKeys.length === 0) {
      throw new Error('At least one GOOGLE_GENERATIVE_AI_API_KEY is required');
    }
    
    console.log(`🔑 Loaded ${this.apiKeys.length} API key(s) for parallel processing`);
    
    // Create models for each API key
    this.models = this.apiKeys.map(key => {
      const genAI = new GoogleGenerativeAI(key);
      return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    });
    
    console.log(`⚡ Created ${this.models.length} parallel models`);
    
    // Initialize usage tracking
    this.apiKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
      this.lastRequestTime.set(key, 0);
    });
  }

  /**
   * Enhanced rate limiting with per-key tracking
   */
  private async checkRateLimit(keyIndex: number): Promise<boolean> {
    const key = this.apiKeys[keyIndex];
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(key) || 0;
    const usageCount = this.keyUsageCount.get(key) || 0;
    
    // Check daily limit
    if (usageCount >= this.dailyRequestsPerKey) {
      console.log(`⚠️  Key ${keyIndex + 1} has reached daily limit (${usageCount}/${this.dailyRequestsPerKey})`);
      return false;
    }
    
    // Check minute-based rate limit (2 requests per minute for free tier)
    const timeSinceLastRequest = now - lastRequest;
    const minDelayBetweenRequests = 60000 / this.requestsPerMinute; // 30 seconds for 2/min
    
    if (timeSinceLastRequest < minDelayBetweenRequests) {
      const waitTime = minDelayBetweenRequests - timeSinceLastRequest;
      console.log(`⏰ Key ${keyIndex + 1} rate limited. Waiting ${Math.ceil(waitTime/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update tracking
    this.lastRequestTime.set(key, Date.now());
    this.keyUsageCount.set(key, usageCount + 1);
    
    return true;
  }

  /**
   * Get the best available API key (lowest usage, not rate limited)
   */
  private getBestAvailableKey(): number {
    const availableKeys = this.apiKeys.map((key, index) => {
      const usage = this.keyUsageCount.get(key) || 0;
      const lastRequest = this.lastRequestTime.get(key) || 0;
      const timeSinceLastRequest = Date.now() - lastRequest;
      const isRateLimited = timeSinceLastRequest < (60000 / this.requestsPerMinute);
      const isExhausted = usage >= this.dailyRequestsPerKey;
      
      return {
        index,
        usage,
        isRateLimited,
        isExhausted,
        score: isExhausted ? -1 : isRateLimited ? 0 : (this.dailyRequestsPerKey - usage)
      };
    }).filter(k => k.score > 0).sort((a, b) => b.score - a.score);
    
    return availableKeys.length > 0 ? availableKeys[0].index : -1;
  }

  async retryFailedTranslations(): Promise<void> {
    console.log('🔄 SMART TRANSLATION RETRY');
    console.log('==========================');
    
    try {
      // Find failed translations that should actually be translated
      const failedTranslations = await this.prisma.translation.findMany({
        where: {
          targetLang: this.targetLanguage,
          sourceText: { equals: this.prisma.translation.fields.translatedText }
        }
      });

      console.log(`📋 Found ${failedTranslations.length} failed translation entries`);

      // Filter to only UI texts that should be translated
      const uiTexts = failedTranslations.filter(t => this.shouldRetryTranslation(t.sourceText));
      
      console.log(`🎯 ${uiTexts.length} texts identified as UI content needing translation`);
      
      if (uiTexts.length === 0) {
        console.log('🎉 No UI texts need translation! All technical content is properly protected.');
        return;
      }

      // Test all API keys
      console.log('\n🧪 Testing all API keys...');
      const { workingModels, workingIndexes } = await this.testAllAPIKeys();
      
      if (workingModels.length === 0) {
        console.log('❌ No working API keys found');
        console.log('⏰ Please check API keys or try again when quota resets');
        return;
      }
      
      console.log(`✅ ${workingModels.length} API key(s) available! Starting parallel translation...`);

      // Process with parallel batches
      const allTexts = uiTexts.map(t => t.sourceText);
      let processedCount = 0;
      let successCount = 0;

      // Process in parallel rounds
      while (processedCount < allTexts.length) {
        const remainingTexts = allTexts.slice(processedCount);
        const parallelBatches = this.createParallelBatches(remainingTexts, workingModels.length);
        
        console.log(`\n� Processing ${parallelBatches.length} parallel batches...`);
        console.log(`📊 Progress: ${processedCount}/${allTexts.length} (${Math.round(processedCount/allTexts.length*100)}%)`);
        
        try {
          const results = await this.translateParallelBatches(parallelBatches, workingModels);
          
          // Process results
          for (let i = 0; i < results.length; i++) {
            if (results[i].success) {
              await this.updateTranslationsInDatabase(results[i].texts, results[i].translations);
              processedCount += results[i].texts.length;
              successCount += results[i].translations.filter((t: string, idx: number) => t !== results[i].texts[idx]).length;
            } else {
              console.log(`⚠️  Batch ${i + 1} failed, skipping...`);
              processedCount += results[i].texts.length; // Count as processed to avoid infinite loop
            }
          }
          
          console.log(`✅ Parallel round complete. Success rate: ${Math.round(successCount/processedCount*100)}%`);
          
          // Rate limiting delay between parallel rounds
          if (processedCount < allTexts.length) {
            console.log(`⏳ Rate limit delay: ${this.rateLimitDelay/1000}s...`);
            await this.delay(this.rateLimitDelay);
          }
          
        } catch (error) {
          console.error('❌ Parallel processing error:', error);
          break;
        }
      }

      console.log('\n🎯 RETRY COMPLETE');
      console.log('=================');
      console.log(`📈 Processed: ${processedCount}/${uiTexts.length} texts`);
      console.log(`✅ Successfully translated: ${successCount}`);
      console.log(`📊 Success rate: ${Math.round(successCount/processedCount*100)}%`);
      
      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('💥 Retry process failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private shouldRetryTranslation(text: string): boolean {
    // Create a proper mock element with necessary methods
    const mockElement = {
      tagName: 'SPAN',
      className: '',
      textContent: text,
      closest: () => null, // Mock closest method
      getAttribute: () => null, // Mock getAttribute method
      parentElement: null
    } as any as HTMLElement;
    
    // First check smart rules
    if (!shouldTranslateText(text, mockElement)) {
      return false;
    }

    // Additional UI text patterns
    const uiPatterns = [
      /^[A-Z][a-zA-Z\s]{1,30}$/, // Capitalized phrases
      /^(Save|Cancel|Delete|Edit|Add|Create|Update|Submit|Reset|Clear|Search|Filter)$/,
      /^(Loading|Processing|Saving|Deleting|Creating|Updating)\.\.\.$/,
      /^(Dashboard|Profile|Settings|Equipment|Clients|Events|Rentals)$/,
      /^(Available|Unavailable|Active|Inactive|Pending|Completed)$/,
      /are you sure/i,
      /successfully/i,
      /failed to/i,
      /invalid/i,
      /required/i
    ];

    return uiPatterns.some(pattern => pattern.test(text.trim()));
  }

  private async testAllAPIKeys(): Promise<{ workingModels: any[]; workingIndexes: number[] }> {
    console.log('🧪 Testing all API keys in parallel...');
    
    const testPromises = this.models.map(async (model, index) => {
      try {
        const testPrompt = 'Translate "Hello" to Portuguese: ';
        const result = await model.generateContent(testPrompt);
        const response = await result.response;
        response.text(); // Try to get text
        return { index, model, success: true };
      } catch (error: any) {
        console.log(`❌ Key ${index + 1} failed: ${error.status || 'unknown'}`);
        return { index, model: null, success: false };
      }
    });
    
    const results = await Promise.all(testPromises);
    const workingResults = results.filter(r => r.success);
    
    const workingModels = workingResults.map(r => r.model);
    const workingIndexes = workingResults.map(r => r.index);
    
    console.log(`✅ ${workingModels.length}/${this.models.length} API keys are working`);
    
    return { workingModels, workingIndexes };
  }

  private createParallelBatches(texts: string[], numKeys: number): string[][] {
    const batches: string[][] = [];
    const batchesPerKey = Math.min(numKeys, texts.length);
    const textsPerBatch = Math.ceil(texts.length / batchesPerKey);
    
    for (let i = 0; i < batchesPerKey; i++) {
      const start = i * textsPerBatch;
      const end = Math.min(start + textsPerBatch, texts.length);
      if (start < texts.length) {
        batches.push(texts.slice(start, end));
      }
    }
    
    return batches;
  }

  private async translateParallelBatches(batches: string[][], models: any[]): Promise<Array<{success: boolean, texts: string[], translations: string[]}>> {
    const results: Array<{success: boolean, texts: string[], translations: string[]}> = [];
    
    // Process batches sequentially with rate limiting instead of parallel
    for (let index = 0; index < batches.length; index++) {
      const texts = batches[index];
      
      // Get the best available API key
      const bestKeyIndex = this.getBestAvailableKey();
      if (bestKeyIndex === -1) {
        console.log(`⚠️  All API keys exhausted or rate limited. Skipping batch ${index + 1}`);
        results.push({ success: false, texts, translations: texts });
        continue;
      }
      
      // Check and wait for rate limits
      const canProceed = await this.checkRateLimit(bestKeyIndex);
      if (!canProceed) {
        console.log(`⚠️  Cannot proceed with key ${bestKeyIndex + 1}. Skipping batch ${index + 1}`);
        results.push({ success: false, texts, translations: texts });
        continue;
      }
      
      const model = models[bestKeyIndex];
      
      try {
        console.log(`📦 Batch ${index + 1}/${batches.length}: Using Key ${bestKeyIndex + 1}, Processing ${texts.length} texts...`);
        
        const prompt = `Translate these English UI texts to Portuguese European (pt-PT). Keep the same tone and style.

RULES:
- Translate UI labels, buttons, and messages naturally  
- Use Portuguese European (not Brazilian Portuguese)
- Keep technical terms when appropriate
- Maintain capitalization patterns
- Return only translations, one per line, in the same order

English texts:
${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}

Portuguese translations:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text();
        
        const translations = translatedText
          .split('\n')
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
          .filter((line: string) => line.length > 0);
        
        // Ensure we have the right number of translations
        while (translations.length < texts.length) {
          translations.push(texts[translations.length]); // Fallback to original
        }
        
        const finalTranslations = translations.slice(0, texts.length);
        console.log(`✅ Batch ${index + 1}: ${finalTranslations.filter((t: string, i: number) => t !== texts[i]).length}/${texts.length} successfully translated`);
        
        results.push({
          success: true,
          texts,
          translations: finalTranslations
        });
        
      } catch (error: any) {
        console.error(`❌ Batch ${index + 1} failed:`, error.status || error.message?.substring(0, 100));
        results.push({
          success: false,
          texts,
          translations: texts // Fallback to original texts
        });
      }
      
      // Add delay between batches to prevent overwhelming the API
      if (index < batches.length - 1) {
        console.log(`⏳ Cooling down 10s before next batch...`);
        await this.delay(10000);
      }
    }
    
    return results;
  }

  private async updateTranslationsInDatabase(texts: string[], translations: string[]): Promise<void> {
    const updates = texts.map(async (text, i) => {
      try {
        await this.prisma.translation.updateMany({
          where: {
            sourceText: text,
            targetLang: this.targetLanguage
          },
          data: {
            translatedText: translations[i],
            updatedAt: new Date()
          }
        });
      } catch (error) {
        console.error(`Failed to update "${text}":`, error);
      }
    });

    await Promise.all(updates);
    console.log(`💾 Updated ${texts.length} translations in database`);
  }

  private async generateFinalReport(): Promise<void> {
    const totalCount = await this.prisma.translation.count({
      where: { targetLang: this.targetLanguage }
    });
    
    const allTranslations = await this.prisma.translation.findMany({
      where: { targetLang: this.targetLanguage },
      select: { sourceText: true, translatedText: true }
    });
    
    const successfulTranslations = allTranslations.filter(t => t.sourceText !== t.translatedText);
    const successRate = Math.round((successfulTranslations.length / totalCount) * 100);
    
    console.log('\n📊 FINAL TRANSLATION REPORT');
    console.log('===========================');
    console.log(`📈 Total entries: ${totalCount}`);
    console.log(`✅ Successful translations: ${successfulTranslations.length}`);
    console.log(`🛡️  Protected content: ${totalCount - successfulTranslations.length}`);
    console.log(`📊 Translation success rate: ${successRate}%`);
    
    if (successfulTranslations.length > 0) {
      console.log('\n🇵🇹 Sample successful translations:');
      successfulTranslations.slice(0, 5).forEach(t => {
        console.log(`"${t.sourceText}" → "${t.translatedText}"`);
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  console.log('🚀 Smart Translation Retry System');
  console.log('==================================');
  
  const retrySystem = new SmartTranslationRetry();
  await retrySystem.retryFailedTranslations();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SmartTranslationRetry };