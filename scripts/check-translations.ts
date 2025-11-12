#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const totalCount = await prisma.translation.count();
    const ptCount = await prisma.translation.count({
      where: { targetLang: 'pt-PT' }
    });
    
    const recentTranslations = await prisma.translation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sourceText: true,
        translatedText: true,
        targetLang: true,
        createdAt: true,
      }
    });
    
    console.log('📊 TRANSLATION DATABASE STATUS');
    console.log('==============================');
    console.log(`📈 Total Translations: ${totalCount}`);
    console.log(`🇵🇹 Portuguese Translations: ${ptCount}`);
    console.log(`📅 Database Updated: ${new Date().toISOString()}`);
    
    if (recentTranslations.length > 0) {
      console.log('\n🔤 Recent Translations:');
      recentTranslations.forEach((t, i) => {
        console.log(`  ${i + 1}. "${t.sourceText}" → "${t.translatedText}" (${t.targetLang})`);
      });
    }
    
    // Calculate coverage estimate
    const originalExtracted = 887; // From extraction script
    const coverage = Math.round((ptCount / originalExtracted) * 100);
    
    console.log('\n🎯 COVERAGE ANALYSIS');
    console.log('====================');
    console.log(`📝 Original extracted texts: ${originalExtracted}`);
    console.log(`✅ Translated texts: ${ptCount}`);
    console.log(`📊 Coverage: ${coverage}%`);
    
    if (coverage >= 75) {
      console.log('🎉 Excellent! Your app should work with minimal API calls');
      console.log('💡 Most UI text is already pre-translated and cached');
    } else if (coverage >= 50) {
      console.log('✅ Good coverage! Many UI elements will load instantly');
      console.log('💡 Consider running more translation batches when API quota resets');
    } else {
      console.log('⚠️  Low coverage. Many texts will still require API translation');
      console.log('💡 Run translation seeding when API quota is available');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);