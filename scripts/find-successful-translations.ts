#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Check older translations that might have been successful
    const oldestTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt-PT' },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: {
        sourceText: true,
        translatedText: true,
        createdAt: true,
      }
    });

    console.log('🕰️  OLDEST TRANSLATIONS (likely successful)');
    console.log('==========================================\n');
    
    let successfulCount = 0;
    
    oldestTranslations.forEach((t, i) => {
      const isTranslated = t.sourceText !== t.translatedText;
      const status = isTranslated ? '✅' : '⚪';
      
      if (isTranslated) successfulCount++;
      
      console.log(`${i + 1}. ${status} "${t.sourceText}" → "${t.translatedText}"`);
      console.log(`   Created: ${t.createdAt.toISOString()}`);
      console.log('');
    });
    
    console.log(`📊 Success rate in oldest batch: ${successfulCount}/${oldestTranslations.length} (${Math.round(successfulCount/oldestTranslations.length*100)}%)`);
    
    // Look for any Portuguese words that might indicate successful translation
    const allTranslations = await prisma.translation.findMany({
      where: { targetLang: 'pt-PT' }
    });
    
    // Common Portuguese words that would indicate successful translation
    const portugueseIndicators = [
      'salvar', 'cancelar', 'excluir', 'editar', 'adicionar', 'atualizar',
      'carregar', 'carregando', 'painel', 'equipamento', 'aluguel',
      'gerenciar', 'configurações', 'usuário', 'senha', 'cliente',
      'evento', 'relatório', 'buscar', 'filtrar', 'ordenar'
    ];
    
    const portugueseTranslations = allTranslations.filter(t =>
      portugueseIndicators.some(word => 
        t.translatedText.toLowerCase().includes(word)
      )
    );
    
    console.log(`\n🇵🇹 FOUND ${portugueseTranslations.length} ACTUAL PORTUGUESE TRANSLATIONS:`);
    console.log('================================================');
    
    portugueseTranslations.slice(0, 10).forEach(t => {
      console.log(`"${t.sourceText}" → "${t.translatedText}"`);
    });
    
    if (portugueseTranslations.length === 0) {
      console.log('\n⚠️  NO ACTUAL PORTUGUESE TRANSLATIONS FOUND!');
      console.log('🔍 This indicates the API quota was exhausted before successful translations');
      console.log('💡 Need to wait for quota reset and retry translation');
    }
    
    // Check when API calls started failing
    const chronologicalSample = await prisma.translation.findMany({
      where: { targetLang: 'pt-PT' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    
    let lastSuccessfulIndex = -1;
    for (let i = 0; i < chronologicalSample.length; i++) {
      if (chronologicalSample[i].sourceText !== chronologicalSample[i].translatedText) {
        lastSuccessfulIndex = i;
      }
    }
    
    if (lastSuccessfulIndex >= 0) {
      console.log(`\n📈 Last successful translation at index ${lastSuccessfulIndex}/${chronologicalSample.length}`);
      console.log(`📅 Failure started around: ${chronologicalSample[lastSuccessfulIndex + 1]?.createdAt}`);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);