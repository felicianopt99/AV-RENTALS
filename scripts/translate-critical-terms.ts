#!/usr/bin/env npx tsx

import { translateText } from '../src/lib/translation.js';

async function translateCriticalTerms() {
  console.log('🚀 TRANSLATING CRITICAL MISSING TERMS');
  console.log('=====================================');
  
  const criticalTerms = [
    "Edit", "Submit", "Remove", "Reports", "City", "Country", 
    "Unavailable", "Confirmed", "Processing", "Saving", "Warning", 
    "Please wait", "Yes", "Check In", "Check Out", "Serial Number", "Model"
  ];
  
  let successCount = 0;
  
  for (const term of criticalTerms) {
    try {
      console.log(`🔄 Translating: "${term}"`);
      const translated = await translateText(term, 'pt');
      
      if (translated && translated !== term) {
        console.log(`  ✅ "${term}" → "${translated}"`);
        successCount++;
      } else {
        console.log(`  ⚠️ "${term}" → No translation or cached`);
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`  ❌ Error translating "${term}":`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${criticalTerms.length} terms translated`);
  console.log('🎯 Essential UI terms should now be complete!');
}

translateCriticalTerms();