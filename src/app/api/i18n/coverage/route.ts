import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetLang = (url.searchParams.get('targetLang') || process.env.DEFAULT_TARGET_LANG || 'pt').trim();
  const projectRoot = process.cwd();
  const jsonPath = path.join(projectRoot, 'enhanced-extracted-ui-texts.json');

  // Load extractor output
  if (!fs.existsSync(jsonPath)) {
    return NextResponse.json(
      { error: 'enhanced-extracted-ui-texts.json not found. Run the extractor first.', dbAvailable: false },
      { status: 404 }
    );
  }

  let extracted: {
    texts: string[];
    details: Array<{ text: string; file: string; category?: string; priority?: string }>;
    summary?: any;
  } = { texts: [], details: [] } as any;

  try {
    extracted = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    return NextResponse.json({ error: 'Failed to parse enhanced-extracted-ui-texts.json' }, { status: 500 });
  }

  const texts = Array.from(new Set(extracted.texts || []));

  // Try DB lookup; if unavailable, still return extracted view
  const prisma = new PrismaClient();
  let dbAvailable = true;
  let existingMap = new Map<string, boolean>();

  try {
    const existing = await prisma.translation.findMany({
      where: { targetLang },
      select: { sourceText: true },
    });
    for (const row of existing) existingMap.set(row.sourceText, true);
  } catch (e) {
    dbAvailable = false;
  } finally {
    await prisma.$disconnect();
  }

  const missing = dbAvailable ? texts.filter(t => !existingMap.has(t)) : texts;

  // Build summaries
  const byFile: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const d of extracted.details || []) {
    const keyFile = d.file || 'unknown';
    byFile[keyFile] = (byFile[keyFile] || 0) + 1;
    const keyCat = (d.category || 'ui');
    byCategory[keyCat] = (byCategory[keyCat] || 0) + 1;
    const keyPri = (d.priority || 'medium');
    byPriority[keyPri] = (byPriority[keyPri] || 0) + 1;
  }

  const totalExtracted = texts.length;
  const translated = dbAvailable ? totalExtracted - missing.length : 0;
  const coverage = dbAvailable && totalExtracted > 0 ? Math.round((translated / totalExtracted) * 100) : 0;

  return NextResponse.json({
    targetLang,
    dbAvailable,
    totalExtracted,
    translated,
    missingCount: missing.length,
    coverage,
    summaries: {
      byFile,
      byCategory,
      byPriority,
    },
    samples: {
      missing: missing.slice(0, 50),
    },
  });
}
