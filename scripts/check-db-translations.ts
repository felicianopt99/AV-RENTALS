#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

async function checkTranslations() {
  const prisma = new PrismaClient();
  
  try {
    // Get total count
    const total = await prisma.translation.count();
    console.log(`📊 Total translations: ${total}`);
    
    // Get some samples
    const samples = await prisma.translation.findMany({
      take: 10,
      orderBy: { sourceText: 'asc' },
      select: {
        sourceText: true,
        translatedText: true,
        targetLang: true
      }
    });
    
    console.log('\n📋 Sample translations:');
    for (const sample of samples) {
      console.log(`"${sample.sourceText}" → "${sample.translatedText}" (${sample.targetLang})`);
    }
    
    // Check for common terms
    const commonTerms = ['Save', 'Cancel', 'Delete', 'Edit', 'Add', 'Dashboard', 'Equipment', 'Client', 'Loading'];
    
    console.log('\n🔍 Looking for common UI terms:');
    for (const term of commonTerms) {
      const found = await prisma.translation.findFirst({
        where: {
          sourceText: {
            contains: term,
            mode: 'insensitive'
          }
        }
      });
      
      if (found) {
        console.log(`✅ "${term}" found: "${found.sourceText}" → "${found.translatedText}"`);
      } else {
        console.log(`❌ "${term}" not found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTranslations();