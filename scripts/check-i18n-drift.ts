#!/usr/bin/env tsx

import path from 'path';
import fs from 'fs';
import { EnhancedUITextExtractor } from './enhanced-ui-text-extractor';

/**
 * Checks for extraction drift without overwriting the canonical JSON file.
 * 1) Loads existing enhanced-extracted-ui-texts.json
 * 2) Runs extractor in-memory
 * 3) Compares translatable texts; exits with non-zero if drift detected
 */
async function main() {
  const cwd = process.cwd();
  const jsonPath = path.join(cwd, 'enhanced-extracted-ui-texts.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ enhanced-extracted-ui-texts.json not found. Run `npm run i18n:extract` first.');
    process.exit(1);
  }

  const saved = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as {
    texts: string[];
    translatableTexts?: number;
    details?: any[];
  };

  const savedSet = new Set((saved.texts || []).map((t) => t.trim()));

  const extractor = new EnhancedUITextExtractor();
  const srcPath = path.join(cwd, 'src');
  await extractor.extractFromDirectory(srcPath);
  const current = extractor.getTranslatableTexts().map((x) => x.text.trim());
  const currentSet = new Set(current);

  // Compute differences
  const missingInSaved: string[] = [];
  for (const t of currentSet) if (!savedSet.has(t)) missingInSaved.push(t);

  const extraInSaved: string[] = [];
  for (const t of savedSet) if (!currentSet.has(t)) extraInSaved.push(t);

  if (missingInSaved.length === 0 && extraInSaved.length === 0) {
    console.log('✅ No extraction drift detected.');
    process.exit(0);
  }

  console.error('❌ Extraction drift detected.');
  if (missingInSaved.length) {
    console.error(`  +${missingInSaved.length} new strings not in saved JSON (showing up to 10):`);
    missingInSaved.slice(0, 10).forEach((t, i) => console.error(`   ${i + 1}. ${t}`));
  }
  if (extraInSaved.length) {
    console.error(`  -${extraInSaved.length} strings in saved JSON not found now (showing up to 10):`);
    extraInSaved.slice(0, 10).forEach((t, i) => console.error(`   ${i + 1}. ${t}`));
  }
  console.error('\nRun `npm run i18n:extract` to refresh the canonical JSON and commit the change.');
  process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
