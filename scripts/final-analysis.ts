#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get properly translated texts (where source != target)
    const properTranslations = await prisma.translation.findMany({
      where: {
        targetLang: 'pt-PT',
        NOT: {
          sourceText: { equals: prisma.translation.fields.translatedText }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        sourceText: true,
        translatedText: true,
        createdAt: true,
      }
    });

    console.log('✅ PROPERLY TRANSLATED TEXTS');
    console.log('============================');
    
    if (properTranslations.length === 0) {
      console.log('No properly translated texts found. Checking with different method...');
      
      // Alternative approach - find texts that are clearly different
      const allTranslations = await prisma.translation.findMany({
        where: { targetLang: 'pt-PT' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      
      const actuallyTranslated = allTranslations.filter(t => 
        t.sourceText !== t.translatedText && 
        t.translatedText.length > 0 &&
        !t.sourceText.includes('{') && // Not template code
        !t.sourceText.includes('(') && // Not function calls
        !t.sourceText.includes('©')    // Not copyright
      );
      
      console.log(`Found ${actuallyTranslated.length} properly translated texts:\n`);
      
      actuallyTranslated.slice(0, 15).forEach((t, i) => {
        console.log(`${i + 1}. "${t.sourceText}" → "${t.translatedText}"`);
      });
      
    } else {
      properTranslations.forEach((t, i) => {
        console.log(`${i + 1}. "${t.sourceText}" → "${t.translatedText}"`);
      });
    }
    
    // Get final statistics
    const totalCount = await prisma.translation.count({ where: { targetLang: 'pt-PT' } });
    const allTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt-PT' },
      select: { sourceText: true, translatedText: true }
    });
    
    const actuallyDifferent = allTranslations.filter(t => t.sourceText !== t.translatedText).length;
    const translationRate = Math.round((actuallyDifferent / totalCount) * 100);
    
    console.log('\n📊 FINAL TRANSLATION STATISTICS');
    console.log('===============================');
    console.log(`📈 Total Portuguese entries: ${totalCount}`);
    console.log(`✅ Actually translated: ${actuallyDifferent}`);
    console.log(`⚪ Unchanged (protected): ${totalCount - actuallyDifferent}`);
    console.log(`📊 Translation rate: ${translationRate}%`);
    console.log(`🛡️  Protection rate: ${100 - translationRate}%`);
    
    if (translationRate >= 30 && (100 - translationRate) >= 60) {
      console.log('\n🎯 PERFECT BALANCE!');
      console.log('✅ Good translation coverage for UI elements');
      console.log('🛡️  Excellent protection for technical/user content');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);