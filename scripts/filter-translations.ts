#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { ContentAnalyzer } from '../src/lib/translationRules';
import fs from 'fs';

/**
 * Smart Translation Filter
 * Filters extracted UI texts to only include truly translatable content
 * Reduces API calls by filtering out code, variables, and non-UI text
 */

class SmartTranslationFilter {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }

  async filterAndPrioritizeTexts(): Promise<void> {
    console.log('🧠 Smart Translation Filter Starting...');
    
    try {
      // Step 1: Load extracted texts
      const extractedPath = 'extracted-ui-texts.json';
      if (!fs.existsSync(extractedPath)) {
        console.error('❌ extracted-ui-texts.json not found. Run npm run translate:extract first.');
        return;
      }
      
      const extractedData = JSON.parse(fs.readFileSync(extractedPath, 'utf-8'));
      const allTexts = extractedData.texts as string[];
      
      console.log(`📝 Loaded ${allTexts.length} extracted texts`);
      
      // Step 2: Apply smart filtering
      console.log('🔍 Applying smart translation rules...');
      const translatableTexts = this.filterTranslatableTexts(allTexts);
      
      console.log(`✅ Filtered to ${translatableTexts.length} translatable texts (${Math.round(translatableTexts.length/allTexts.length*100)}% of original)`);
      
      // Step 3: Check existing translations
      console.log('🔍 Checking existing translations...');
      const existingTranslations = await this.prisma.translation.findMany({
        where: {
          sourceText: { in: translatableTexts },
          targetLang: 'pt',
        },
        select: { sourceText: true },
      });
      
      const existingTexts = new Set(existingTranslations.map(t => t.sourceText));
      const newTexts = translatableTexts.filter(text => !existingTexts.has(text));
      
      console.log(`📊 ${existingTranslations.length} already translated, ${newTexts.length} need translation`);
      
      // Step 4: Prioritize by importance
      const prioritizedTexts = this.prioritizeTexts(newTexts);
      
      // Step 5: Save filtered results
      const filteredData = {
        filteredAt: new Date().toISOString(),
        originalCount: allTexts.length,
        translatableCount: translatableTexts.length,
        alreadyTranslated: existingTranslations.length,
        needsTranslation: newTexts.length,
        prioritizedTexts,
        summary: {
          highPriority: prioritizedTexts.high.length,
          mediumPriority: prioritizedTexts.medium.length,
          lowPriority: prioritizedTexts.low.length,
        },
      };
      
      fs.writeFileSync('filtered-translations.json', JSON.stringify(filteredData, null, 2));
      console.log('💾 Filtered results saved to filtered-translations.json');
      
      // Step 6: Show recommendations
      this.showRecommendations(filteredData);
      
    } catch (error) {
      console.error('💥 Error during filtering:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private filterTranslatableTexts(texts: string[]): string[] {
    const translatable: string[] = [];
    let filtered = 0;
    
    for (const text of texts) {
      const t = text.trim();
      if (!t) { filtered++; continue; }
      // Server-safe heuristics using ContentAnalyzer
      const isExcluded = 
        ContentAnalyzer.isPersonalData(t) ||
        ContentAnalyzer.isBusinessData(t) ||
        ContentAnalyzer.isSystemIdentifier(t) ||
        ContentAnalyzer.isDateOrTime(t);
      if (isExcluded) { filtered++; continue; }

      // Positive UI signal
      const looksLikeUI = ContentAnalyzer.isUIText(t);
      if (looksLikeUI && this.isUIRelevant(t)) {
        translatable.push(t);
      } else {
        filtered++;
      }
    }
    
    console.log(`🚫 Filtered out ${filtered} non-translatable texts`);
    return translatable;
  }

  private isUIRelevant(text: string): boolean {
    const cleanText = text.trim();
    
    // Skip very short text (likely not meaningful UI)
    if (cleanText.length < 2) return false;
    
    // Skip text that's mostly symbols or punctuation
    const letterCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < cleanText.length * 0.6) return false;
    
    // Skip code-like patterns
    const codePatterns = [
      /^[a-z][a-zA-Z0-9]*$/, // camelCase variables
      /^[A-Z][A-Z_0-9]*$/, // CONSTANTS
      /^\$\{.*\}$/, // Template literals
      /^\/.*\/$/, // Regex patterns
      /^\..*/, // CSS classes
      /^#.*/, // IDs or hex colors
      /^<.*>$/, // HTML tags
      /^\w+\(\)/, // Function calls
      /^\w+\.\w+/, // Object properties
      /^import\s/, // Import statements
      /^export\s/, // Export statements
      /^const\s/, // Variable declarations
      /^let\s/, 
      /^var\s/,
      /^function\s/, // Function declarations
      /^class\s/, // Class declarations
      /^\d+\.\d+\.\d+/, // Version numbers
    ];
    
    for (const pattern of codePatterns) {
      if (pattern.test(cleanText)) return false;
    }
    
    // Skip file paths and technical strings
    if (cleanText.includes('/') && cleanText.length > 10) return false;
    if (cleanText.includes('\\') && cleanText.length > 5) return false;
    if (cleanText.includes('::') || cleanText.includes('->')) return false;
    
    // Prioritize UI-like text
    const uiPatterns = [
      /^(Save|Cancel|Delete|Edit|Add|Remove|Update|Create|Submit|Reset)$/,
      /^(Loading|Saving|Processing|Please wait)/,
      /^(Error|Success|Warning|Info):/,
      /are you sure/i,
      /successfully/i,
      /failed to/i,
      /invalid/i,
      /required/i,
    ];
    
    for (const pattern of uiPatterns) {
      if (pattern.test(cleanText)) return true;
    }
    
    // Accept text that looks like sentences or phrases
    if (cleanText.split(' ').length >= 2 && /^[A-Z]/.test(cleanText)) return true;
    if (cleanText.includes(' ') && cleanText.length >= 5) return true;
    
    // Accept common single words that are likely UI
    const uiWords = [
      'Dashboard', 'Home', 'Profile', 'Settings', 'Help', 'About',
      'Equipment', 'Clients', 'Events', 'Rentals', 'Maintenance',
      'Login', 'Logout', 'Register', 'Password', 'Username',
      'Name', 'Email', 'Phone', 'Address', 'City', 'Country',
      'Date', 'Time', 'Status', 'Category', 'Type', 'Description',
      'Price', 'Quantity', 'Total', 'Available', 'Unavailable',
      'Active', 'Inactive', 'Pending', 'Completed', 'Cancelled',
    ];
    
    return uiWords.includes(cleanText);
  }

  private prioritizeTexts(texts: string[]): { high: string[], medium: string[], low: string[] } {
    const high: string[] = [];
    const medium: string[] = [];
    const low: string[] = [];
    
    // High priority: Common UI actions and messages
    const highPatterns = [
      /^(Save|Cancel|Delete|Edit|Add|Remove|Update|Create|Submit|Reset|Login|Logout)$/,
      /^(Loading|Saving|Processing|Please wait)/,
      /^(Error|Success|Warning):/,
      /successfully/i,
      /failed to/i,
      /are you sure/i,
      /Dashboard|Home|Profile|Settings/,
    ];
    
    // Medium priority: Form labels and common phrases
    const mediumPatterns = [
      /^(Name|Email|Phone|Address|Date|Time|Status|Type|Category|Description)$/,
      /^(Equipment|Client|Event|Rental|Maintenance|Inventory)$/,
      /^(Available|Unavailable|Active|Inactive|Pending|Completed)$/,
      /required|optional/i,
      /invalid|valid/i,
    ];
    
    for (const text of texts) {
      let isHigh = false;
      let isMedium = false;
      
      for (const pattern of highPatterns) {
        if (pattern.test(text)) {
          high.push(text);
          isHigh = true;
          break;
        }
      }
      
      if (!isHigh) {
        for (const pattern of mediumPatterns) {
          if (pattern.test(text)) {
            medium.push(text);
            isMedium = true;
            break;
          }
        }
      }
      
      if (!isHigh && !isMedium) {
        low.push(text);
      }
    }
    
    return { high, medium, low };
  }

  private showRecommendations(data: any): void {
    console.log('\n📊 SMART FILTERING REPORT');
    console.log('========================');
    console.log(`🔢 Original texts: ${data.originalCount}`);
    console.log(`✅ Translatable: ${data.translatableCount} (${Math.round(data.translatableCount/data.originalCount*100)}%)`);
    console.log(`📚 Already translated: ${data.alreadyTranslated}`);
    console.log(`🆕 Need translation: ${data.needsTranslation}`);
    
    console.log('\n🎯 Priority Breakdown:');
    console.log(`  🔴 High Priority: ${data.summary.highPriority} texts`);
    console.log(`  🟡 Medium Priority: ${data.summary.mediumPriority} texts`);
    console.log(`  🟢 Low Priority: ${data.summary.lowPriority} texts`);
    
    console.log('\n💡 Recommendations:');
    
    if (data.needsTranslation === 0) {
      console.log('🎉 All translatable content is already in the database!');
      console.log('💡 Your app should work with zero API calls for existing content.');
      return;
    }
    
    const apiCallsNeeded = Math.ceil(data.needsTranslation / 15); // 15 texts per batch
    const timeNeeded = Math.ceil(apiCallsNeeded * 8); // 8 seconds between calls
    
    console.log(`📡 API calls needed: ~${apiCallsNeeded}`);
    console.log(`⏱️  Estimated time: ~${Math.round(timeNeeded/60)} minutes`);
    
    if (apiCallsNeeded > 50) {
      console.log('⚠️  Large number of API calls required!');
      console.log('💡 Consider translating in stages:');
      console.log(`   1. High priority (${data.summary.highPriority} texts, ~${Math.ceil(data.summary.highPriority/15)} calls)`);
      console.log(`   2. Medium priority (${data.summary.mediumPriority} texts, ~${Math.ceil(data.summary.mediumPriority/15)} calls)`);
      console.log(`   3. Low priority (${data.summary.lowPriority} texts, ~${Math.ceil(data.summary.lowPriority/15)} calls)`);
    } else {
      console.log('✅ Reasonable number of API calls - can proceed with full translation');
    }
    
    console.log('\n🚀 Next steps:');
    console.log('1. Review filtered-translations.json');
    console.log('2. Run: npm run translate:seed-smart (for filtered texts only)');
    console.log('3. Or run: npm run translate:seed-priority high (for high priority only)');
  }
}

// Create mock DOM for shouldTranslateText function
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      className: '',
      id: '',
      getAttribute: () => null,
      textContent: '',
    }),
  };
}

async function main() {
  const filter = new SmartTranslationFilter();
  await filter.filterAndPrioritizeTexts();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { SmartTranslationFilter };