#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

/**
 * Ingest enhanced-extracted-ui-texts.json into the translations table.
 * - For each text, ensure a row exists for each target language.
 * - Does not overwrite existing translations.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const projectRoot = process.cwd();
    const extractorPath = path.join(projectRoot, 'enhanced-extracted-ui-texts.json');

    if (!fs.existsSync(extractorPath)) {
      console.error('❌ enhanced-extracted-ui-texts.json not found. Run `npm run i18n:extract` first.');
      process.exit(1);
    }

    const raw = JSON.parse(fs.readFileSync(extractorPath, 'utf-8')) as {
      texts: string[];
      details: Array<{ text: string; file: string; category?: string; priority?: string }>;
    };

    const texts = Array.from(new Set(raw.texts || []));
    if (texts.length === 0) {
      console.log('✅ No texts to ingest.');
      return;
    }

    // Target languages: default to ['pt'], can be overridden via env
    const targetLangs = (process.env.TARGET_LANGS || 'pt').split(',').map(s => s.trim()).filter(Boolean);

    console.log(`📥 Ingesting ${texts.length} texts for targetLangs: ${targetLangs.join(', ')}`);

    let created = 0;
    let skipped = 0;

    // Build quick lookup for file/category/priority from details
    const metaByText = new Map<string, { file?: string; category?: string; priority?: string }>();
    for (const d of raw.details || []) {
      if (!metaByText.has(d.text)) metaByText.set(d.text, { file: d.file, category: d.category, priority: d.priority });
    }

    for (const text of texts) {
      for (const targetLang of targetLangs) {
        // Check if translation row exists
        const existing = await prisma.translation.findFirst({
          where: { sourceText: text, targetLang },
          select: { id: true },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create minimal row; avoid assuming extra columns
        await prisma.translation.create({
          data: {
            sourceText: text,
            targetLang,
            translatedText: '',
            status: 'missing',
            // category: metaByText.get(text)?.category,
            // priority: metaByText.get(text)?.priority,
            // firstSeenFile: metaByText.get(text)?.file,
          } as any,
        });

        created++;
      }
    }

    console.log(`✅ Ingestion complete. Created: ${created}, Skipped (already exists): ${skipped}`);
  } catch (err) {
    console.error('❌ Ingestion error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
