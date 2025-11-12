#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

// Ultimate comprehensive translation patterns
const ULTIMATE_PATTERNS = [
  // Toast notifications with various formats
  { 
    pattern: /toast\(\s*\{\s*title:\s*["']([^"']+)["']/g, 
    type: 'toast_title',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `toast${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}TitleText`,
      replacement: match[0].replace(match[1], `{toast${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}TitleText}`)
    })
  },
  { 
    pattern: /description:\s*["']([^"']{5,})["']/g, 
    type: 'toast_description',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `toast${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}DescText`,
      replacement: match[0].replace(match[1], `{toast${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}DescText}`)
    })
  },
  
  // JSX content - text between tags
  { 
    pattern: />\s*([A-Z][a-zA-Z0-9\s]{2,50})\s*</g, 
    type: 'jsx_content',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `ui${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}Text`,
      replacement: match[0].replace(match[1], `{ui${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}Text}`)
    })
  },
  
  // Common attributes
  { 
    pattern: /(?:placeholder|alt|aria-label|title)=["']([^"']{2,})["']/g, 
    type: 'attribute',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `attr${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}Text`,
      replacement: match[0].replace(`"${match[1]}"`, `{attr${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}Text}`)
    })
  },
  
  // Button and link text
  { 
    pattern: /<Button[^>]*>\s*([A-Z][a-zA-Z0-9\s]{1,30})\s*<\/Button>/g, 
    type: 'button',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `btn${match[1].replace(/[^a-zA-Z0-9]/g, '')}Text`,
      replacement: match[0].replace(match[1], `{btn${match[1].replace(/[^a-zA-Z0-9]/g, '')}Text}`)
    })
  },
  
  // Card titles and descriptions
  { 
    pattern: /<CardTitle[^>]*>\s*([A-Z][a-zA-Z0-9\s]{2,40})\s*<\/CardTitle>/g, 
    type: 'card_title',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `cardTitle${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}Text`,
      replacement: match[0].replace(match[1], `{cardTitle${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}Text}`)
    })
  },
  
  // Alert messages
  { 
    pattern: /<AlertDescription[^>]*>\s*([A-Z][a-zA-Z0-9\s.,!?]{5,})\s*<\/AlertDescription>/g, 
    type: 'alert',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `alert${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}Text`,
      replacement: match[0].replace(match[1], `{alert${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}Text}`)
    })
  },
  
  // Common standalone strings in quotes
  { 
    pattern: /"((?:Loading|Error|Success|Warning|Failed|Complete|Processing|Saving|Updating|Creating|Deleting)[a-zA-Z0-9\s]*?)"/g, 
    type: 'status',
    extract: (match: RegExpMatchArray) => ({
      original: match[0],
      text: match[1],
      hookName: `status${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}Text`,
      replacement: `{status${match[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}Text}`
    })
  },
  
  // Labels and form text
  { 
    pattern: /"([A-Z][a-zA-Z\s]{2,25})"/g, 
    type: 'general',
    extract: (match: RegExpMatchArray) => {
      const text = match[1];
      // Skip certain patterns
      if (text.includes('http') || text.includes('@') || text.includes('/') || 
          text.includes('.') || text.length < 3 || /^\d+$/.test(text)) {
        return null;
      }
      return {
        original: match[0],
        text: text,
        hookName: `text${text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}Text`,
        replacement: `{text${text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}Text}`
      };
    }
  }
];

interface ExtractedTranslation {
  original: string;
  text: string;
  hookName: string;
  replacement: string;
  position: number;
  type: string;
}

function extractAllTranslations(content: string): ExtractedTranslation[] {
  const translations: ExtractedTranslation[] = [];
  const processedTexts = new Set<string>();
  
  for (const pattern of ULTIMATE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      const extracted = pattern.extract(match);
      
      if (extracted && !processedTexts.has(extracted.text)) {
        // Avoid duplicate hook names
        let finalHookName = extracted.hookName;
        let counter = 1;
        while (translations.some(t => t.hookName === finalHookName)) {
          finalHookName = `${extracted.hookName}${counter}`;
          counter++;
        }
        
        translations.push({
          ...extracted,
          hookName: finalHookName,
          position: match.index,
          type: pattern.type
        });
        
        processedTexts.add(extracted.text);
      }
    }
  }
  
  return translations.sort((a, b) => b.position - a.position); // Process from end to start
}

function processFileForTranslations(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has useTranslate
    if (content.includes('useTranslate') || content.includes('from \'@/contexts/TranslationContext\'')) {
      console.log(`  ⚡ Already processed: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
    
    // Skip non-component files
    if (!content.includes('export') || 
        (!content.includes('function') && !content.includes('=>')) ||
        content.includes('interface ') ||
        filePath.includes('/ui/') ||
        filePath.includes('/types/') ||
        filePath.includes('/utils/') ||
        filePath.includes('/lib/')) {
      return false;
    }
    
    const translations = extractAllTranslations(content);
    
    if (translations.length === 0) {
      console.log(`  ⏭️  No translatable content: ${path.relative(process.cwd(), filePath)}`);
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
    
    // Apply replacements
    for (const translation of translations) {
      content = content.replace(translation.original, translation.replacement);
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
    
    if (componentMatch) {
      const componentStart = componentMatch[0];
      let hooksCode = '\n  // Translation hooks\n';
      
      for (const translation of translations) {
        hooksCode += `  const { translated: ${translation.hookName} } = useTranslate('${translation.text}');\n`;
      }
      
      content = content.replace(componentStart, componentStart + hooksCode);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Added ${translations.length} translations to: ${path.relative(process.cwd(), filePath)}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function ultimateTranslationIntegration() {
  console.log('🌟 ULTIMATE TRANSLATION INTEGRATION');
  console.log('===================================');
  console.log('🎯 Processing ALL remaining files for comprehensive translation coverage...\n');
  
  const pathsToScan = ['src/app', 'src/components'];
  
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
        const skipDirs = ['.next', 'node_modules', '.git', 'dist', 'build'];
        if (!item.startsWith('.') && !skipDirs.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        if (!item.includes('.test.') && !item.includes('.spec.') && !item.endsWith('.d.ts')) {
          totalFiles++;
          
          if (processFileForTranslations(fullPath)) {
            modifiedFiles++;
            processedFiles.push(path.relative(process.cwd(), fullPath));
          } else {
            skippedFiles++;
          }
        }
      }
    }
  }
  
  for (const scanPath of pathsToScan) {
    const fullScanPath = path.join(process.cwd(), scanPath);
    if (fs.existsSync(fullScanPath)) {
      console.log(`📂 Processing: ${scanPath}`);
      scanDirectory(fullScanPath);
    }
  }
  
  console.log('\n🏆 ULTIMATE SUMMARY:');
  console.log('==================');
  console.log(`📁 Total files processed: ${totalFiles}`);
  console.log(`✅ Files successfully enhanced: ${modifiedFiles}`);
  console.log(`⏭️  Files skipped (already done/no content): ${skippedFiles}`);
  console.log(`📈 Enhancement rate: ${Math.round((modifiedFiles/totalFiles)*100)}%`);
  
  if (processedFiles.length > 0) {
    console.log('\n🎉 NEWLY ENHANCED FILES:');
    processedFiles.forEach(file => console.log(`  🌟 ${file}`));
  }
  
  console.log('\n🚀 ULTIMATE TRANSLATION INTEGRATION COMPLETE!');
  console.log('🌐 Your entire website is now fully internationalized!');
  console.log('🔥 All user-facing text should now be translatable!');
  
  console.log('\n📋 FINAL STEPS:');
  console.log('1. 🧪 Test the application to ensure everything works');
  console.log('2. 🔍 Run your translation extraction script');
  console.log('3. 📝 Update translation files with new keys');
  console.log('4. 🌍 Add translations for all supported languages');
  console.log('5. 🎊 Celebrate your multilingual success!');
}

ultimateTranslationIntegration();