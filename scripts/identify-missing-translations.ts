#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Read extracted UI texts
    const extractedData = JSON.parse(fs.readFileSync('/home/feli/AV-RENTALS/extracted-ui-texts.json', 'utf8'));
    const allTexts = extractedData.texts;
    
    console.log('🔍 IDENTIFYING MISSING TRANSLATIONS');
    console.log('===================================');
    console.log(`📝 Total extracted texts: ${allTexts.length}`);
    
    // Get existing translations
    const existingTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt' },
      select: { sourceText: true }
    });
    
    const translatedTexts = new Set(existingTranslations.map(t => t.sourceText));
    console.log(`✅ Already translated: ${translatedTexts.size}`);
    
    // Find missing translations
    const missingTexts = allTexts.filter((text: string) => !translatedTexts.has(text));
    console.log(`❌ Missing translations: ${missingTexts.length}`);
    console.log(`📊 Coverage: ${Math.round((translatedTexts.size / allTexts.length) * 100)}%`);
    
    // Categorize missing texts
    const uiTexts = missingTexts.filter((text: string) => {
      // Filter out code, technical strings, etc.
      return (
        text.length > 1 &&
        text.length < 100 &&
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
        !text.includes('www') &&
        !text.includes('.com') &&
        !text.includes('©') &&
        !text.includes('®') &&
        !text.includes('™') &&
        !text.match(/^\d+$/) && // Not just numbers
        !text.match(/^[A-Z_]+$/) && // Not constants
        !text.match(/^[a-z]+\.[a-z]+/) && // Not object properties
        !text.startsWith('/*') &&
        !text.startsWith('//') &&
        text.trim().length > 0
      );
    });
    
    console.log(`\n🎯 UI TEXTS NEEDING TRANSLATION: ${uiTexts.length}`);
    console.log('=====================================');
    
    if (uiTexts.length > 0) {
      console.log('\n📋 First 20 texts to translate:');
      uiTexts.slice(0, 20).forEach((text: string, i: number) => {
        console.log(`${i + 1}. "${text}"`);
      });
      
      if (uiTexts.length > 20) {
        console.log(`... and ${uiTexts.length - 20} more texts`);
      }
    } else {
      console.log('🎉 All UI texts are already translated!');
    }
    
    // Show some examples of what's been filtered out
    const filteredOut = missingTexts.filter((text: string) => !uiTexts.includes(text));
    if (filteredOut.length > 0) {
      console.log(`\n🔧 Filtered out ${filteredOut.length} technical/code texts`);
      console.log('Examples of filtered texts:');
      filteredOut.slice(0, 10).forEach((text: string, i: number) => {
        console.log(`${i + 1}. "${text}"`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);