#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function optimizeBatchQueue() {
  console.log('🧠 SMART BATCH OPTIMIZATION');
  console.log('============================');
  
  const missingPath = path.join(process.cwd(), 'missing-translations.json');
  if (!fs.existsSync(missingPath)) {
    console.log('❌ Run find-missing-translations.ts first');
    return;
  }
  
  const missing = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));
  const allTexts = [...missing.criticalTexts, ...missing.missingTexts];
  
  // Smart filtering and prioritization
  const smartFiltered = allTexts.filter((text: string) => {
    // Skip very long texts (likely descriptions)
    if (text.length > 100) return false;
    
    // Skip code-like patterns
    if (text.includes('${') || text.includes('()') || text.includes('===') || 
        text.includes('&&') || text.includes('||') || text.startsWith('#') ||
        text.startsWith('(') || text.startsWith('./') || text.startsWith('/*') ||
        text.includes('Promise') || text.includes('Dispatch')) return false;
    
    // Skip pure numbers or technical patterns
    if (/^\d+(\.\d+)?$/.test(text) || /^[A-Z_]{3,}$/.test(text)) return false;
    
    // Must contain letters and be reasonable UI text
    if (!/[a-zA-Z]/.test(text) || text.length < 2) return false;
    
    return true;
  });
  
  // Priority scoring system
  const scored = smartFiltered.map((text: string) => {
    let score = 0;
    
    // High priority UI actions
    if (/\b(save|cancel|delete|edit|add|create|update|submit|confirm|close|open|back|next)\b/i.test(text)) {
      score += 100;
    }
    
    // Navigation and status terms
    if (/\b(dashboard|equipment|client|rental|quote|inventory|category|status|active|pending)\b/i.test(text)) {
      score += 80;
    }
    
    // Form fields and labels
    if (/\b(name|email|phone|address|date|time|price|quantity|description|notes)\b/i.test(text)) {
      score += 60;
    }
    
    // Common messages
    if (/\b(loading|error|success|warning|please|wait|try|again|are you sure)\b/i.test(text)) {
      score += 70;
    }
    
    // Shorter texts are generally more important
    if (text.length < 20) score += 30;
    else if (text.length < 40) score += 10;
    
    // Single words are often important
    if (!/\s/.test(text) && text.length > 2) score += 50;
    
    return { text, score };
  });
  
  // Sort by priority score
  const prioritized = scored
    .sort((a, b) => b.score - a.score)
    .map(item => item.text)
    .slice(0, 300); // Limit to top 300 for efficient processing
  
  console.log(`📊 Optimization Results:`);
  console.log(`Original texts: ${missing.totalMissing}`);
  console.log(`After filtering: ${smartFiltered.length}`);
  console.log(`Prioritized queue: ${prioritized.length}`);
  
  // Show top priorities
  console.log(`\n🎯 Top 20 priority texts:`);
  prioritized.slice(0, 20).forEach((text, i) => {
    console.log(`  ${i + 1}. "${text}"`);
  });
  
  // Estimate processing time
  const batchSize = 12; // 4 keys * 3 texts each
  const batches = Math.ceil(prioritized.length / batchSize);
  const estimatedMinutes = batches * 0.6; // ~35s per batch
  
  console.log(`\n⏱️  Processing estimate:`);
  console.log(`Batches needed: ${batches}`);
  console.log(`Estimated time: ${Math.round(estimatedMinutes)} minutes`);
  console.log(`Texts per batch: ${batchSize} (distributed across 4 API keys)`);
  
  // Save optimized queue
  fs.writeFileSync(
    path.join(process.cwd(), 'optimized-translation-queue.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalTexts: prioritized.length,
      estimatedBatches: batches,
      estimatedMinutes,
      queue: prioritized
    }, null, 2)
  );
  
  console.log(`\n💾 Saved optimized queue to: optimized-translation-queue.json`);
  console.log(`🚀 Ready to run advanced-batch-translate.ts!`);
}

optimizeBatchQueue();