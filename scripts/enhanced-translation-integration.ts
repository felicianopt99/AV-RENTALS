#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

// Enhanced translation patterns with better detection
const ENHANCED_PATTERNS = [
  // Toast messages and notifications
  { pattern: /title:\s*["']([^"']+)["']/g, hookPrefix: 'title', category: 'toast' },
  { pattern: /description:\s*["']([^"']+)["']/g, hookPrefix: 'desc', category: 'toast' },
  
  // JSX text content
  { pattern: />\s*["']([A-Z][^"']{2,40})["']\s*</g, hookPrefix: 'text', category: 'ui' },
  
  // Button and action text
  { pattern: /(?:aria-label|placeholder|alt)=["']([^"']+)["']/g, hookPrefix: 'label', category: 'accessibility' },
  
  // Common UI patterns
  { pattern: /"(Loading[^"]*)"/, hookName: 'loadingText', defaultValue: 'Loading...' },
  { pattern: /"(Access Denied)"/, hookName: 'accessDeniedText', defaultValue: 'Access Denied' },
  { pattern: /"(No .* found)"/, hookName: 'noDataText', defaultValue: 'No data found' },
  { pattern: /"(Create)"/, hookName: 'createText', defaultValue: 'Create' },
  { pattern: /"(Add)"/, hookName: 'addText', defaultValue: 'Add' },
  { pattern: /"(Edit)"/, hookName: 'editText', defaultValue: 'Edit' },
  { pattern: /"(Delete)"/, hookName: 'deleteText', defaultValue: 'Delete' },
  { pattern: /"(Save)"/, hookName: 'saveText', defaultValue: 'Save' },
  { pattern: /"(Cancel)"/, hookName: 'cancelText', defaultValue: 'Cancel' },
  { pattern: /"(Submit)"/, hookName: 'submitText', defaultValue: 'Submit' },
  { pattern: /"(Confirm)"/, hookName: 'confirmText', defaultValue: 'Confirm' },
  { pattern: /"(Back)"/, hookName: 'backText', defaultValue: 'Back' },
  { pattern: /"(Next)"/, hookName: 'nextText', defaultValue: 'Next' },
  { pattern: /"(Previous)"/, hookName: 'previousText', defaultValue: 'Previous' },
  { pattern: /"(Search)"/, hookName: 'searchText', defaultValue: 'Search' },
  { pattern: /"(Filter)"/, hookName: 'filterText', defaultValue: 'Filter' },
  { pattern: /"(Export)"/, hookName: 'exportText', defaultValue: 'Export' },
  { pattern: /"(Import)"/, hookName: 'importText', defaultValue: 'Import' },
  { pattern: /"(Download)"/, hookName: 'downloadText', defaultValue: 'Download' },
  { pattern: /"(Upload)"/, hookName: 'uploadText', defaultValue: 'Upload' },
  { pattern: /"(Backup)"/, hookName: 'backupText', defaultValue: 'Backup' },
  { pattern: /"(Restore)"/, hookName: 'restoreText', defaultValue: 'Restore' },
  { pattern: /"(Settings)"/, hookName: 'settingsText', defaultValue: 'Settings' },
  { pattern: /"(Profile)"/, hookName: 'profileText', defaultValue: 'Profile' },
  { pattern: /"(Dashboard)"/, hookName: 'dashboardText', defaultValue: 'Dashboard' },
  { pattern: /"(Overview)"/, hookName: 'overviewText', defaultValue: 'Overview' },
  { pattern: /"(Details)"/, hookName: 'detailsText', defaultValue: 'Details' },
  { pattern: /"(Actions)"/, hookName: 'actionsText', defaultValue: 'Actions' },
  { pattern: /"(Status)"/, hookName: 'statusText', defaultValue: 'Status' },
  { pattern: /"(Name)"/, hookName: 'nameText', defaultValue: 'Name' },
  { pattern: /"(Description)"/, hookName: 'descriptionText', defaultValue: 'Description' },
  { pattern: /"(Email)"/, hookName: 'emailText', defaultValue: 'Email' },
  { pattern: /"(Phone)"/, hookName: 'phoneText', defaultValue: 'Phone' },
  { pattern: /"(Address)"/, hookName: 'addressText', defaultValue: 'Address' },
  { pattern: /"(Date)"/, hookName: 'dateText', defaultValue: 'Date' },
  { pattern: /"(Time)"/, hookName: 'timeText', defaultValue: 'Time' },
  { pattern: /"(Price)"/, hookName: 'priceText', defaultValue: 'Price' },
  { pattern: /"(Total)"/, hookName: 'totalText', defaultValue: 'Total' },
  { pattern: /"(Quantity)"/, hookName: 'quantityText', defaultValue: 'Quantity' },
  
  // Business domain specific
  { pattern: /"(Equipment)"/, hookName: 'equipmentText', defaultValue: 'Equipment' },
  { pattern: /"(Inventory)"/, hookName: 'inventoryText', defaultValue: 'Inventory' },
  { pattern: /"(Client)"/, hookName: 'clientText', defaultValue: 'Client' },
  { pattern: /"(Clients)"/, hookName: 'clientsText', defaultValue: 'Clients' },
  { pattern: /"(Event)"/, hookName: 'eventText', defaultValue: 'Event' },
  { pattern: /"(Events)"/, hookName: 'eventsText', defaultValue: 'Events' },
  { pattern: /"(Rental)"/, hookName: 'rentalText', defaultValue: 'Rental' },
  { pattern: /"(Rentals)"/, hookName: 'rentalsText', defaultValue: 'Rentals' },
  { pattern: /"(Quote)"/, hookName: 'quoteText', defaultValue: 'Quote' },
  { pattern: /"(Quotes)"/, hookName: 'quotesText', defaultValue: 'Quotes' },
  { pattern: /"(Maintenance)"/, hookName: 'maintenanceText', defaultValue: 'Maintenance' },
  { pattern: /"(Reports)"/, hookName: 'reportsText', defaultValue: 'Reports' },
  { pattern: /"(Users)"/, hookName: 'usersText', defaultValue: 'Users' },
  { pattern: /"(Admin)"/, hookName: 'adminText', defaultValue: 'Admin' },
];

interface TranslationMatch {
  text: string;
  hookName: string;
  defaultValue: string;
  position: number;
}

function extractTranslatableText(content: string): TranslationMatch[] {
  const matches: TranslationMatch[] = [];
  const processedTexts = new Set<string>();
  
  // Process simple patterns first
  for (const { pattern, hookName, defaultValue } of ENHANCED_PATTERNS) {
    if (hookName && defaultValue) {
      const regex = new RegExp(pattern.source, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const text = match[1] || match[0];
        const cleanText = text.replace(/['"]/g, '');
        
        if (!processedTexts.has(cleanText) && cleanText.length > 1) {
          matches.push({
            text: match[0],
            hookName,
            defaultValue: cleanText,
            position: match.index
          });
          processedTexts.add(cleanText);
        }
      }
    }
  }
  
  // Extract toast/notification messages
  const toastTitlePattern = /title:\s*["']([^"']+)["']/g;
  const toastDescPattern = /description:\s*["']([^"']+)["']/g;
  
  let match;
  while ((match = toastTitlePattern.exec(content)) !== null) {
    const text = match[1];
    if (!processedTexts.has(text)) {
      const hookName = `toast${text.replace(/[^a-zA-Z0-9]/g, '')}TitleText`;
      matches.push({
        text: match[0],
        hookName,
        defaultValue: text,
        position: match.index
      });
      processedTexts.add(text);
    }
  }
  
  while ((match = toastDescPattern.exec(content)) !== null) {
    const text = match[1];
    if (!processedTexts.has(text)) {
      const hookName = `toast${text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}DescText`;
      matches.push({
        text: match[0],
        hookName,
        defaultValue: text,
        position: match.index
      });
      processedTexts.add(text);
    }
  }
  
  // Extract JSX text content
  const jsxTextPattern = />\s*["']([A-Z][^"']{2,40})["']\s*</g;
  while ((match = jsxTextPattern.exec(content)) !== null) {
    const text = match[1];
    if (!processedTexts.has(text) && !text.includes('http') && !text.includes('@')) {
      const hookName = `ui${text.replace(/[^a-zA-Z0-9]/g, '')}Text`;
      matches.push({
        text: match[0],
        hookName,
        defaultValue: text,
        position: match.index
      });
      processedTexts.add(text);
    }
  }
  
  return matches.sort((a, b) => b.position - a.position); // Process from end to start
}

function addTranslationsToFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has useTranslate
    if (content.includes('useTranslate') || content.includes('from \'@/contexts/TranslationContext\'')) {
      console.log(`  ⚡ Already has translation: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
    
    // Skip certain file types
    const skipPatterns = [
      'ui/', 'icons/', '.test.', '.spec.', '.d.ts', 
      'types.ts', 'utils.ts', 'config.ts', 'constants.ts'
    ];
    
    if (skipPatterns.some(pattern => filePath.includes(pattern))) {
      return false;
    }
    
    // Check if it's a React component
    if (!content.includes('export') || (!content.includes('tsx') && !content.includes('jsx'))) {
      return false;
    }
    
    const matches = extractTranslatableText(content);
    
    if (matches.length === 0) {
      return false;
    }
    
    // Add import
    const importMatch = content.match(/(import.*?from.*?;[\s\n]*)+/);
    if (importMatch) {
      const importSection = importMatch[0];
      const translationImport = `import { useTranslate } from '@/contexts/TranslationContext';\n`;
      content = content.replace(importSection, importSection + translationImport);
    } else {
      content = `import { useTranslate } from '@/contexts/TranslationContext';\n${content}`;
    }
    
    // Replace text with hooks (from end to start to maintain positions)
    const hookNames = new Set<string>();
    for (const { text, hookName } of matches) {
      const replacement = text.includes('title:') ? `title: ${hookName}` :
                          text.includes('description:') ? `description: ${hookName}` :
                          text.replace(/["'][^"']+["']/, `{${hookName}}`);
      
      content = content.replace(text, replacement);
      hookNames.add(hookName);
    }
    
    // Add hooks to component
    const componentPatterns = [
      /(export default function \w+\([^)]*\)\s*\{)/,
      /(export function \w+\([^)]*\)\s*\{)/,
      /(const \w+[^=]*=\s*\([^)]*\)\s*=>\s*\{)/,
      /(function \w+\([^)]*\)\s*\{)/
    ];
    
    let componentMatch = null;
    for (const pattern of componentPatterns) {
      componentMatch = content.match(pattern);
      if (componentMatch) break;
    }
    
    if (componentMatch && hookNames.size > 0) {
      const componentStart = componentMatch[0];
      let hooksCode = '\n  // Translation hooks\n';
      
      Array.from(hookNames).forEach(hookName => {
        const matchedTranslation = matches.find(m => m.hookName === hookName);
        const defaultValue = matchedTranslation?.defaultValue || hookName;
        hooksCode += `  const { translated: ${hookName} } = useTranslate('${defaultValue}');\n`;
      });
      
      content = content.replace(componentStart, componentStart + hooksCode);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Added ${hookNames.size} translations to: ${path.relative(process.cwd(), filePath)}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function enhancedTranslationIntegration() {
  console.log('🚀 ENHANCED TRANSLATION INTEGRATION');
  console.log('==================================');
  
  const pathsToScan = [
    { path: 'src/app', description: 'Page components' },
    { path: 'src/components', description: 'UI components' },
  ];
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  let skippedFiles = 0;
  const processedFiles: string[] = [];
  
  function scanDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const skipDirs = ['.next', 'node_modules', '.git', 'dist', 'build', '__tests__'];
        if (!item.startsWith('.') && !skipDirs.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const skipPatterns = ['.test.', '.spec.', '.d.ts'];
        if (!skipPatterns.some(pattern => item.includes(pattern))) {
          totalFiles++;
          
          if (addTranslationsToFile(fullPath)) {
            modifiedFiles++;
            processedFiles.push(path.relative(process.cwd(), fullPath));
          } else {
            skippedFiles++;
          }
        }
      }
    }
  }
  
  console.log('📁 Processing files for translation integration...\n');
  
  for (const { path: scanPath, description } of pathsToScan) {
    const fullScanPath = path.join(process.cwd(), scanPath);
    if (fs.existsSync(fullScanPath)) {
      console.log(`📂 Processing: ${scanPath} (${description})`);
      scanDirectory(fullScanPath);
    }
  }
  
  console.log('\n📊 FINAL SUMMARY:');
  console.log('================');
  console.log(`📁 Total files processed: ${totalFiles}`);
  console.log(`✅ Files successfully modified: ${modifiedFiles}`);
  console.log(`⏭️  Files skipped: ${skippedFiles}`);
  console.log(`📈 Success rate: ${Math.round((modifiedFiles/totalFiles)*100)}%`);
  
  if (processedFiles.length > 0) {
    console.log('\n🔄 SUCCESSFULLY MODIFIED FILES:');
    processedFiles.forEach(file => console.log(`  ✓ ${file}`));
  }
  
  console.log('\n🎉 Enhanced translation integration complete!');
  console.log('🔥 Your website is now fully translatable!');
}

enhancedTranslationIntegration();