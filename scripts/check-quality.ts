#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get the most recent 20 translations to check quality
    const recentTranslations = await prisma.translation.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        sourceText: true,
        translatedText: true,
        targetLang: true,
        createdAt: true,
      }
    });
    
    console.log('🔍 TRANSLATION QUALITY ANALYSIS');
    console.log('===============================');
    console.log(`📅 Checking ${recentTranslations.length} most recent translations\n`);
    
    let properTranslations = 0;
    let unchangedTexts = 0;
    
    recentTranslations.forEach((t, i) => {
      const isTranslated = t.sourceText !== t.translatedText;
      const status = isTranslated ? '✅ TRANSLATED' : '⚠️  UNCHANGED';
      
      if (isTranslated) properTranslations++;
      else unchangedTexts++;
      
      console.log(`${i + 1}. ${status}`);
      console.log(`   EN: "${t.sourceText}"`);
      console.log(`   PT: "${t.translatedText}"`);
      console.log(`   Date: ${t.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Analysis
    const translationRate = Math.round((properTranslations / recentTranslations.length) * 100);
    
    console.log('📊 QUALITY METRICS');
    console.log('==================');
    console.log(`✅ Properly Translated: ${properTranslations}/${recentTranslations.length} (${translationRate}%)`);
    console.log(`⚠️  Unchanged/Failed: ${unchangedTexts}/${recentTranslations.length} (${100-translationRate}%)`);
    
    if (translationRate >= 80) {
      console.log('\n🎉 EXCELLENT translation quality!');
    } else if (translationRate >= 60) {
      console.log('\n✅ GOOD translation quality');
    } else {
      console.log('\n⚠️  Translation quality needs improvement');
    }
    
    // Get some stats on different text types
    const buttonTexts = await prisma.translation.findMany({
      where: {
        sourceText: {
          in: ['Save', 'Cancel', 'Delete', 'Edit', 'Add', 'Create', 'Update', 'Submit']
        },
        targetLang: 'pt-PT'
      },
      select: { sourceText: true, translatedText: true }
    });
    
    if (buttonTexts.length > 0) {
      console.log('\n🔘 BUTTON TRANSLATIONS');
      console.log('=====================');
      buttonTexts.forEach(bt => {
        console.log(`"${bt.sourceText}" → "${bt.translatedText}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Quality check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);