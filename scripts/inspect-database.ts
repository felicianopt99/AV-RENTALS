#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get a sample of translations to see what's happening
    const sampleTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt-PT' },
      take: 10,
      select: {
        id: true,
        sourceText: true,
        translatedText: true,
        model: true,
        createdAt: true,
      }
    });

    console.log('🔍 DATABASE SAMPLE INSPECTION');
    console.log('=============================\n');
    
    sampleTranslations.forEach((t, i) => {
      const isIdentical = t.sourceText === t.translatedText;
      const sourceLength = t.sourceText.length;
      const targetLength = t.translatedText.length;
      
      console.log(`${i + 1}. ID: ${t.id}`);
      console.log(`   Source (${sourceLength} chars): "${t.sourceText}"`);
      console.log(`   Target (${targetLength} chars): "${t.translatedText}"`);
      console.log(`   Model: ${t.model}`);
      console.log(`   Identical: ${isIdentical ? 'YES' : 'NO'}`);
      console.log(`   Created: ${t.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Look for specific known UI terms
    const commonUITerms = ['Save', 'Cancel', 'Delete', 'Edit', 'Loading', 'Dashboard', 'Equipment', 'Rental'];
    
    console.log('🔤 CHECKING COMMON UI TERMS');
    console.log('===========================');
    
    for (const term of commonUITerms) {
      const translation = await prisma.translation.findFirst({
        where: {
          sourceText: term,
          targetLang: 'pt-PT'
        }
      });
      
      if (translation) {
        const isDifferent = translation.sourceText !== translation.translatedText;
        console.log(`"${term}" → "${translation.translatedText}" (${isDifferent ? 'TRANSLATED' : 'UNCHANGED'})`);
      } else {
        console.log(`"${term}" → NOT FOUND`);
      }
    }
    
    // Check if we have any non-English text at all
    const nonEnglishPattern = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i;
    const withAccents = await prisma.translation.findMany({
      where: { targetLang: 'pt-PT' },
      take: 100
    });
    
    const hasPortuguese = withAccents.filter(t => 
      nonEnglishPattern.test(t.translatedText) || 
      t.translatedText.includes('ção') ||
      t.translatedText.includes('ão') ||
      t.translatedText.includes('ões')
    );
    
    console.log(`\n🇵🇹 PORTUGUESE TEXT DETECTION`);
    console.log(`==============================`);
    console.log(`Found ${hasPortuguese.length} entries with Portuguese characteristics`);
    
    hasPortuguese.slice(0, 5).forEach(t => {
      console.log(`"${t.sourceText}" → "${t.translatedText}"`);
    });
    
  } catch (error) {
    console.error('❌ Inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);