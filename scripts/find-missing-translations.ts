#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function findMissingTranslations() {
  const prisma = new PrismaClient();
  
  try {
    // Read the extracted texts
    const extractedPath = path.join(process.cwd(), 'extracted-ui-texts.json');
    if (!fs.existsSync(extractedPath)) {
      console.log('❌ No extracted-ui-texts.json found. Run extract-ui-texts.ts first.');
      return;
    }
    
    const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf-8'));
    console.log(`📊 Extracted ${extracted.totalTexts} potential UI texts`);
    
    // Get all existing translations
    const existingTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt' },
      select: { sourceText: true }
    });
    
    const existingTexts = new Set(existingTranslations.map(t => t.sourceText));
    console.log(`📦 Found ${existingTexts.size} existing translations`);
    
    // Filter for actual UI texts (not code fragments)
    const actualUITexts = extracted.texts.filter((text: string) => {
      // Skip if already translated
      if (existingTexts.has(text)) return false;
      
      // Skip code-like patterns
      if (text.includes('${') || text.includes('()') || text.includes('===') || 
          text.includes('&&') || text.includes('||') || text.startsWith('#') ||
          text.startsWith('(') || text.startsWith('./') || text.startsWith('/*') ||
          text.includes('Promise') || text.includes('Dispatch') || text.includes('VariantProps') ||
          /^[a-z][a-zA-Z0-9]*$/.test(text) || // camelCase variables
          /^[A-Z_]+$/.test(text) || // CONSTANTS
          /^\d+(\.\d+)?\s*(px|em|rem|%|vh|vw|MB|DPI)$/.test(text) || // CSS/units
          /^[0-9\-\s]+$/.test(text) || // numbers/dates
          text.length < 3) return false;
      
      // Must contain letters and be reasonable UI text
      if (!/[a-zA-Z]/.test(text)) return false;
      if (text.length > 100) return false; // Too long to be UI text
      
      return true;
    });
    
    console.log(`🎯 Found ${actualUITexts.length} missing UI texts to translate`);
    
    // Show samples
    console.log('\n📋 Sample missing translations:');
    actualUITexts.slice(0, 20).forEach((text: string, i: number) => {
      console.log(`  ${i + 1}. "${text}"`);
    });
    
    if (actualUITexts.length > 20) {
      console.log(`  ... and ${actualUITexts.length - 20} more`);
    }
    
    // Check for specific patterns that should definitely be translated
    const criticalPatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // "Title Case" patterns
      /^[A-Z][a-z]+$/, // Single words
      /\b(button|form|field|label|title|message|error|success|warning|info)\b/i,
      /\b(create|update|delete|save|cancel|confirm|submit|reset|close|open)\b/i,
      /\b(name|email|phone|address|date|time|price|quantity|total|status)\b/i,
    ];
    
    const criticalMissing = actualUITexts.filter((text: string) => 
      criticalPatterns.some(pattern => pattern.test(text))
    );
    
    console.log(`\n🚨 Critical missing translations (${criticalMissing.length}):`);
    criticalMissing.slice(0, 15).forEach((text: string, i: number) => {
      console.log(`  ${i + 1}. "${text}"`);
    });
    
    // Save the filtered list for batch translation
    const outputPath = path.join(process.cwd(), 'missing-translations.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalMissing: actualUITexts.length,
      criticalCount: criticalMissing.length,
      missingTexts: actualUITexts,
      criticalTexts: criticalMissing
    }, null, 2));
    
    console.log(`\n💾 Saved missing translations to: ${outputPath}`);
    console.log('🚀 Ready to run batch translation on these texts!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingTranslations();