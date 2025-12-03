#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Enhanced UI Text Extraction Script
 * Scans all source files to extract translatable UI text strings with better precision
 */

interface EnhancedExtractedText {
  text: string;
  file: string;
  line: number;
  context: string;
  type: 'component' | 'page' | 'hook' | 'lib' | 'api';
  category: 'ui' | 'error' | 'placeholder' | 'validation' | 'navigation' | 'content' | 'technical';
  priority: 'high' | 'medium' | 'low';
  requiresTranslation: boolean;
}

class EnhancedUITextExtractor {
  private enhancedTexts: EnhancedExtractedText[] = [];

  // Patterns to match UI texts (expanded coverage)
  private enhancedPatterns = [
    // Common component titles/descriptions
    /<AlertTitle[^>]*>([^<]+)</g,
    /<AlertDescription[^>]*>([^<]+)</g,
    /<DialogTitle[^>]*>([^<]+)</g,
    /<DialogDescription[^>]*>([^<]+)</g,
    /<CardTitle[^>]*>([^<]+)</g,
    /<CardDescription[^>]*>([^<]+)</g,

    // Labels and helpers
    /<Label[^>]*>([^<]+)</g,
    /<FormLabel[^>]*>([^<]+)</g,
    /<p[^>]*className[^>]*text-muted-foreground[^>]*>([^<]+)</g,

    // Buttons
    /<Button[^>]*>([^<]+)</g,
    /<button[^>]*>([^<]+)</g,

    // Placeholders
    /<Input[^>]*placeholder=['"`]([^'"`]+)['"`]/g,
    /<textarea[^>]*placeholder=['"`]([^'"`]+)['"`]/g,

    // Select options
    /<SelectItem[^>]*value=['"`][^'"`]*['"`]>([^<]+)</g,

    // Tables
    /<th[^>]*>([^<]+)</g,
    /<td[^>]*>([^<]+)</g,

    // Badges/status
    /<Badge[^>]*>([^<]+)</g,

    // Tabs/nav triggers
    /<TabsTrigger[^>]*>([^<]+)</g,

    // Error and validation messages
    /className[^>]*text-destructive[^>]*>([^<]+)</g,
    /error=['"`]([^'"`]+)['"`]/g,

    // Success indicators
    /className[^>]*text-green-[^>]*>([^<]+)</g,

    // Loading text
    />\s*(Loading\.\.\.|Please wait\.\.\.|Saving\.\.\.|Processing\.\.\.)\s*</g,

    // Titles/tooltips/aria
    /title=['"`]([^'"`]{4,})['"`]/g,
    /aria-label=['"`]([^'"`]+)['"`]/g,

    // Generic JSX inner text between tags
    />\s*([A-Z][a-zA-Z][a-zA-Z\s'\-:,]{1,80})\s*</g,

    // Translation helpers already in code
    /useTranslate\(['"`]([^'"`]+)['"`]\)/g,
    /\bt\(['"`]([^'"`]+)['"`]\)/g,

    // Toast messages
    /toast\(\s*{[^}]*title:\s*['"`]([^'"`]+)['"`]/g,
    /toast\(\s*{[^}]*description:\s*['"`]([^'"`]+)['"`]/g,

    // Throw/console strings
    /throw new Error\(['"`]([^'"`]+)['"`]\)/g,
    /console\.(log|error|warn)\(['"`]([^'"`]+)['"`]/g,
  ];

  // Skip patterns for non-UI content
  private enhancedSkipPatterns = [
    /^[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9]*$/, // object.prop
    /^[a-zA-Z][a-zA-Z0-9]*\(\)$/, // func()
    /^[a-zA-Z][a-zA-Z0-9]*<.*>$/, // generics
    /\bimport\b|\bexport\b|\bfrom\b/, // imports/exports
    /className=|style=|onClick=|onChange=|onSubmit=/, // attrs
    /href=|src=|width=|height=|type=|name=|id=|key=|ref=|value=|checked=|disabled=|required=/,
    /readOnly=|autoFocus=|aria-|data-|role=|tabIndex=|autoComplete=|spellCheck=/,
    /^https?:\/\//, // URLs
    /^\/[\w\/-]*$/, // paths
    /^#[0-9A-Fa-f]{3,6}$/, // hex
    /^\d+(\.\d+)?\s*(px|em|rem|%|vh|vw|pt|mb|kb|gb|dpi)$/i, // units
    /^[A-Z_]{2,}$/, // CONSTANTS
    /^[a-z][a-zA-Z0-9]*$/, // camelCase
    /^[0-9\-:\s.]+$/, // numbers/dates
  ];

  private categorizeText(text: string, context: string): EnhancedExtractedText['category'] {
    const lt = text.toLowerCase();
    const lc = context.toLowerCase();
    if (lt.includes('error') || lt.includes('failed') || lc.includes('destructive')) return 'error';
    if (lc.includes('placeholder') || lt.startsWith('enter ') || lt.includes('search')) return 'placeholder';
    if (lt.includes('required') || lt.includes('invalid') || lc.includes('validation')) return 'validation';
    if (lc.includes('tabs') || lc.includes('nav') || ['home','dashboard','settings','profile'].some(w=>lt.includes(w))) return 'navigation';
    if (lt.length > 80 || lc.includes('description')) return 'content';
    if (/loading|please wait|processing|saving/.test(lt)) return 'ui';
    return 'ui';
  }

  private determinePriority(text: string, category: EnhancedExtractedText['category'], context: string): EnhancedExtractedText['priority'] {
    const lt = text.toLowerCase();
    const lc = context.toLowerCase();
    if (category === 'error' || category === 'validation') return 'high';
    if (['save','delete','cancel','submit','login','register'].some(w=>lt.includes(w)) || lc.includes('button')) return 'high';
    if (category === 'placeholder' || lc.includes('label') || lc.includes('form')) return 'medium';
    if (category === 'content' || category === 'technical' || text.length > 100) return 'low';
    return 'medium';
  }

  private requiresTranslation(text: string, category: EnhancedExtractedText['category']): boolean {
    if (category === 'technical') return false;
    if (text.trim().length < 2) return false;
    if (!/[a-zA-Z]/.test(text)) return false;
    if (!/[a-zA-Z]{2,}/.test(text)) return false;
    const technicalTerms = ['px','em','rem','vh','vw','pt','pc','dpi','mb','kb','gb','url','http','https'];
    if (technicalTerms.includes(text.trim().toLowerCase())) return false;
    return true;
  }

  private isValidText(text: string): boolean {
    const t = text.trim();
    if (!t || t.length < 2) return false;
    if (!/[a-zA-Z]/.test(t)) return false;
    
    // Exclude template literals or interpolation leftovers
    if (t.includes('${')) return false;
    
    // Exclude common technical tokens (case-insensitive)
    if (/(^|\b)(promise|json|api|http|https|url|deepl|prisma|react|typescript)(\b|$)/i.test(t)) return false;
    
    // Exclude obvious file/extension hints
    if (t.includes('./') || /\.(ts|tsx|json|sh)(\b|$)/i.test(t)) return false;
    
    const letterCount = (t.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < t.length * 0.5) return false;
    
    for (const p of this.enhancedSkipPatterns) {
      if (p.test(t)) return false;
    }
    return true;
  }

  private getFileType(filePath: string): EnhancedExtractedText['type'] {
    if (filePath.includes('/pages/') || filePath.includes('/app/')) return 'page';
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/lib/')) return 'lib';
    if (filePath.includes('/api/')) return 'api';
    return 'component';
  }

  async extractFromDirectory(dirPath: string): Promise<void> {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: dirPath,
      ignore: ['node_modules/**','.next/**','build/**','dist/**','**/*.test.*','**/*.spec.*','**/*.d.ts'],
    });
    for (const file of files) {
      await this.extractFromFile(path.join(dirPath, file));
    }
  }

  private async extractFromFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const fileType = this.getFileType(filePath);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of this.enhancedPatterns) {
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(line)) !== null) {
            const raw = match[1] || match[2];
            if (!raw) continue;
            const clean = raw.trim();
            if (!this.isValidText(clean)) continue;
            const category = this.categorizeText(clean, line);
            const priority = this.determinePriority(clean, category, line);
            const needs = this.requiresTranslation(clean, category);
            this.enhancedTexts.push({
              text: clean,
              file: path.relative(process.cwd(), filePath),
              line: i + 1,
              context: line.trim(),
              type: fileType,
              category,
              priority,
              requiresTranslation: needs,
            });
          }
        }
      }
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e);
    }
  }

  getEnhancedTexts(): EnhancedExtractedText[] { return this.enhancedTexts; }
  getTranslatableTexts(): EnhancedExtractedText[] { return this.enhancedTexts.filter(x => x.requiresTranslation); }
  getTextsByPriority(p: EnhancedExtractedText['priority']): EnhancedExtractedText[] { return this.getTranslatableTexts().filter(x => x.priority === p); }
  getTextsByCategory(c: EnhancedExtractedText['category']): EnhancedExtractedText[] { return this.getTranslatableTexts().filter(x => x.category === c); }

  private groupBy<T extends keyof EnhancedExtractedText>(items: EnhancedExtractedText[], key: T): Record<string, number> {
    return items.reduce((acc, it) => { const k = String(it[key]); acc[k] = (acc[k]||0)+1; return acc; }, {} as Record<string, number>);
  }

  saveEnhancedToFile(outputPath: string): void {
    const translatable = this.getTranslatableTexts();
    const data = {
      extractedAt: new Date().toISOString(),
      totalFound: this.enhancedTexts.length,
      translatableCount: translatable.length,
      texts: translatable.map(t => t.text),
      details: translatable,
      summary: {
        byType: this.groupBy(translatable, 'type'),
        byCategory: this.groupBy(translatable, 'category'),
        byPriority: this.groupBy(translatable, 'priority'),
        byFile: this.groupBy(translatable, 'file'),
      },
    };
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Saved: ${outputPath}`);
  }
}

async function main() {
  const extractor = new EnhancedUITextExtractor();
  const srcPath = path.join(process.cwd(), 'src');
  const out = path.join(process.cwd(), 'enhanced-extracted-ui-texts.json');
  console.log('Starting enhanced extraction...');
  await extractor.extractFromDirectory(srcPath);
  console.log(`Found ${extractor.getEnhancedTexts().length} raw texts`);
  console.log(`Translatable ${extractor.getTranslatableTexts().length}`);
  console.log('Sample (10):');
  extractor.getTranslatableTexts().slice(0,10).forEach((t,i)=>console.log(`${i+1}. "${t.text}" [${t.category}|${t.priority}]`));
  extractor.saveEnhancedToFile(out);
  console.log('Done.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { EnhancedUITextExtractor };
