// translation-rules.ts
// Loads and provides translation rules from translation-rules.json
import fs from 'fs';
import path from 'path';

export type TranslationRules = Record<string, string>;

export function loadTranslationRules(): TranslationRules {
  const rulesPath = path.resolve(process.cwd(), 'translation-rules.json');
  try {
    const raw = fs.readFileSync(rulesPath, 'utf-8');
    // Remove comments and parse
    const cleaned = raw.replace(/\/\/.*$/gm, '');
    return JSON.parse(cleaned);
  } catch (e) {
    return {};
  }
}
