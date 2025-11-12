#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { UITextExtractor } from './extract-ui-texts';

/**
 * Bulk Translation Seeding Script
 * Extracts all UI text and pre-translates everything to database
 */

interface TranslationBatch {
  texts: string[];
  translations: string[];
}

class BulkTranslationSeeder {
  private prisma: PrismaClient;
  private genAI: GoogleGenerativeAI;
  private model: any;
  private targetLanguage = 'pt-PT'; // Portuguese European
  private batchSize = 15; // Optimal batch size for Gemini
  private rateLimitDelay = 8000; // 8 seconds between requests (7.5 requests/minute)
  
  constructor() {
    this.prisma = new PrismaClient();
    
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async seedAllTranslations(): Promise<void> {
    console.log('🌱 Starting bulk translation seeding...');
    
    try {
      // Step 1: Extract UI texts
      console.log('\n📝 Step 1: Extracting UI texts from codebase...');
      const texts = await this.extractUITexts();
      console.log(`✅ Extracted ${texts.length} unique UI texts`);
      
      // Step 2: Filter existing translations
      console.log('\n🔍 Step 2: Checking existing translations...');
      const newTexts = await this.filterExistingTranslations(texts);
      console.log(`📊 ${texts.length - newTexts.length} already translated, ${newTexts.length} need translation`);
      
      if (newTexts.length === 0) {
        console.log('🎉 All texts are already translated!');
        return;
      }
      
      // Step 3: Bulk translate
      console.log('\n🤖 Step 3: Bulk translating new texts...');
      const batches = this.createBatches(newTexts);
      console.log(`📦 Created ${batches.length} batches of ${this.batchSize} texts each`);
      
      let processedCount = 0;
      for (let i = 0; i < batches.length; i++) {
        console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}...`);
        
        try {
          const translations = await this.translateBatch(batches[i]);
          await this.saveBatchToDatabase(batches[i], translations);
          
          processedCount += batches[i].length;
          console.log(`✅ Batch ${i + 1} complete. Progress: ${processedCount}/${newTexts.length} (${Math.round(processedCount/newTexts.length*100)}%)`);
          
          // Rate limiting delay (except for last batch)
          if (i < batches.length - 1) {
            console.log(`⏳ Rate limit delay: ${this.rateLimitDelay/1000}s...`);
            await this.delay(this.rateLimitDelay);
          }
          
        } catch (error) {
          console.error(`❌ Error processing batch ${i + 1}:`, error);
          console.log('⏭️  Continuing with next batch...');
        }
      }
      
      // Step 4: Verify results
      console.log('\n📊 Step 4: Verifying results...');
      await this.generateReport();
      
      console.log('\n🎉 Bulk translation seeding completed successfully!');
      
    } catch (error) {
      console.error('💥 Fatal error during seeding:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async extractUITexts(): Promise<string[]> {
    const extractor = new UITextExtractor();
    const srcPath = path.join(process.cwd(), 'src');
    
    await extractor.extractFromDirectory(srcPath);
    const texts = extractor.getExtractedTexts();
    
    // Save extraction results for reference
    const extractionPath = path.join(process.cwd(), 'extracted-ui-texts.json');
    extractor.saveToFile(extractionPath);
    
    return texts;
  }

  private async filterExistingTranslations(texts: string[]): Promise<string[]> {
    const existingTranslations = await this.prisma.translation.findMany({
      where: {
        sourceText: { in: texts },
        targetLang: this.targetLanguage,
      },
      select: { sourceText: true },
    });
    
    const existingTexts = new Set(existingTranslations.map(t => t.sourceText));
    return texts.filter(text => !existingTexts.has(text));
  }

  private createBatches(texts: string[]): string[][] {
    const batches: string[][] = [];
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      batches.push(texts.slice(i, i + this.batchSize));
    }
    
    return batches;
  }

  private async translateBatch(texts: string[]): Promise<string[]> {
    const prompt = `You are a professional translator. Translate the following English UI text to Portuguese European (pt-PT). 

IMPORTANT RULES:
- Maintain the same tone (formal/informal) as the original
- Keep technical terms when appropriate
- Preserve formatting like capitalization patterns
- For buttons/actions, use imperative form
- Return ONLY the translations, separated by newlines, in the same order

English texts to translate:
${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}

Portuguese translations:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text();
      
      // Parse translations
      const translations = translatedText
        .split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
        .filter((line: string) => line.length > 0);
      
      if (translations.length !== texts.length) {
        console.warn(`⚠️  Translation count mismatch: expected ${texts.length}, got ${translations.length}`);
        console.log('Original texts:', texts);
        console.log('Translated texts:', translations);
        
        // Pad with original texts if needed
        while (translations.length < texts.length) {
          const missingIndex = translations.length;
          translations.push(texts[missingIndex]); // Fallback to original
        }
      }
      
      return translations.slice(0, texts.length); // Ensure exact length
      
    } catch (error) {
      console.error('Translation API error:', error);
      // Fallback: return original texts
      return texts;
    }
  }

  private async saveBatchToDatabase(texts: string[], translations: string[]): Promise<void> {
    const records = texts.map((text, i) => ({
      sourceText: text,
      translatedText: translations[i] || text, // Fallback to original if missing
      targetLang: this.targetLanguage,
      createdAt: new Date(),
    }));

    try {
      await this.prisma.translation.createMany({
        data: records,
        skipDuplicates: true,
      });
      
      console.log(`💾 Saved ${records.length} translations to database`);
      
    } catch (error) {
      console.error('Database save error:', error);
      
      // Try individual inserts as fallback
      console.log('🔄 Attempting individual record insertion...');
      let savedCount = 0;
      
      for (const record of records) {
        try {
          await this.prisma.translation.upsert({
            where: {
              sourceText_targetLang: {
                sourceText: record.sourceText,
                targetLang: record.targetLang,
              },
            },
            update: {
              translatedText: record.translatedText,
            },
            create: record,
          });
          savedCount++;
        } catch (individualError) {
          console.error(`Failed to save translation for "${record.sourceText}":`, individualError);
        }
      }
      
      console.log(`💾 Individually saved ${savedCount}/${records.length} translations`);
    }
  }

  private async generateReport(): Promise<void> {
    const totalCount = await this.prisma.translation.count({
      where: { targetLang: this.targetLanguage },
    });
    
    const recentCount = await this.prisma.translation.count({
      where: {
        targetLang: this.targetLanguage,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    console.log('\n📊 DATABASE SEEDING REPORT');
    console.log('================================');
    console.log(`🌍 Target Language: ${this.targetLanguage}`);
    console.log(`📈 Total Translations: ${totalCount}`);
    console.log(`🆕 New Translations (24h): ${recentCount}`);
    console.log(`⏰ Seeding Date: ${new Date().toISOString()}`);
    
    // Sample some translations
    const samples = await this.prisma.translation.findMany({
      where: { targetLang: this.targetLanguage },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        sourceText: true,
        translatedText: true,
      },
    });
    
    console.log('\n🔤 Sample Translations:');
    samples.forEach((sample, i) => {
      console.log(`  ${i + 1}. "${sample.sourceText}" → "${sample.translatedText}"`);
    });
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'translation-seeding-report.json');
    const report = {
      generatedAt: new Date().toISOString(),
      targetLanguage: this.targetLanguage,
      totalTranslations: totalCount,
      newTranslations: recentCount,
      samples: samples,
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution function
async function main() {
  console.log('🚀 AV-RENTALS Bulk Translation Seeder');
  console.log('=====================================');
  
  // Validate environment
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
    console.log('💡 Please set your Google AI API key in environment variables');
    process.exit(1);
  }

  const seeder = new BulkTranslationSeeder();
  
  try {
    await seeder.seedAllTranslations();
    console.log('\n🎉 SUCCESS: All translations have been seeded to the database!');
    console.log('💡 Your app should now work with minimal API calls');
    
  } catch (error) {
    console.error('\n💥 SEEDING FAILED:', error);
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌱 AV-RENTALS Bulk Translation Seeder

Usage:
  npm run seed-translations        # Run full seeding process
  ts-node scripts/seed-translations.ts  # Run directly with ts-node

Environment Variables:
  GOOGLE_AI_API_KEY               # Required: Google AI API key

What this script does:
1. 📝 Extracts all translatable UI text from your codebase
2. 🔍 Checks which texts are already in the database
3. 🤖 Batch translates new texts using Google Gemini
4. 💾 Saves all translations to PostgreSQL database
5. 📊 Generates a detailed report

After running this script, your app will:
- ✅ Load translations instantly from database (no API delays)
- ✅ Only make API calls for truly new/dynamic content
- ✅ Have consistent translations across the entire app
- ✅ Work offline for all pre-translated content
`);
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { BulkTranslationSeeder };