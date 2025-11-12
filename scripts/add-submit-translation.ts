#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

async function addMissingSubmit() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Adding missing "Submit" translation...');
    
    await prisma.translation.upsert({
      where: {
        sourceText_targetLang: {
          sourceText: 'Submit',
          targetLang: 'pt'
        }
      },
      update: {
        translatedText: 'Submeter',
        updatedAt: new Date()
      },
      create: {
        sourceText: 'Submit',
        targetLang: 'pt',
        translatedText: 'Submeter',
        model: 'manual'
      }
    });
    
    console.log('✅ "Submit" → "Submeter" added successfully!');
    
    // Check final coverage
    const total = await prisma.translation.count();
    console.log(`📊 Total translations now: ${total}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingSubmit();