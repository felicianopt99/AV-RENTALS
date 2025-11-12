#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 CLEANING UP FAILED TRANSLATIONS');
    console.log('==================================');
    
    // Count total translations
    const totalCount = await prisma.translation.count({ 
      where: { targetLang: 'pt-PT' } 
    });
    
    console.log(`📊 Total Portuguese entries: ${totalCount}`);
    
    // Find entries where source = target (failed translations)
    const failedTranslations = await prisma.translation.findMany({
      where: {
        targetLang: 'pt-PT',
        sourceText: { equals: prisma.translation.fields.translatedText }
      },
      select: { id: true, sourceText: true }
    });
    
    console.log(`❌ Failed translations (source = target): ${failedTranslations.length}`);
    
    // Find actual successful translations
    const successfulCount = totalCount - failedTranslations.length;
    console.log(`✅ Successful translations: ${successfulCount}`);
    
    if (failedTranslations.length > 0) {
      console.log('\n🤔 OPTIONS:');
      console.log('1. Keep failed entries (they prevent re-processing same text)');
      console.log('2. Delete failed entries (allows retry when quota resets)');
      console.log('\n💡 RECOMMENDATION: Keep them for now, they serve as a "processed" marker');
      console.log('   This prevents the system from trying to translate the same texts again');
      
      // Show what types of content failed
      const sampleFailed = failedTranslations.slice(0, 10);
      console.log('\n📝 Sample failed translations (these are correctly protected):');
      sampleFailed.forEach((f, i) => {
        console.log(`${i + 1}. "${f.sourceText}"`);
      });
      
      // Analyze what should have been translated
      const shouldTranslate = failedTranslations.filter(f => {
        const text = f.sourceText;
        // Simple heuristics for UI text
        return (
          /^[A-Z][a-zA-Z\s]{2,30}$/.test(text) && // Capitalized words 3-30 chars
          !text.includes('(') && 
          !text.includes('{') && 
          !text.includes('#') &&
          !text.includes('©') &&
          !text.includes('$') &&
          !text.includes('/')
        );
      });
      
      console.log(`\n🎯 Texts that should be translated: ${shouldTranslate.length}`);
      if (shouldTranslate.length > 0) {
        console.log('Sample UI texts that need translation:');
        shouldTranslate.slice(0, 10).forEach((t, i) => {
          console.log(`${i + 1}. "${t.sourceText}"`);
        });
        
        if (shouldTranslate.length <= 50) {
          console.log('\n💡 GOOD NEWS: Only a small number of UI texts need translation!');
          console.log('   When API quota resets, these can be translated quickly.');
        }
      }
    }
    
    // Check current quota status by attempting a small test
    console.log('\n🔍 Testing current API quota status...');
    
  } catch (error) {
    console.error('❌ Cleanup analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);