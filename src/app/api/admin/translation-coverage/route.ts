import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { glob } from 'glob';

const REPORTS_DIR = path.resolve(process.cwd(), 'reports');
const MISSING_PATH = path.join(REPORTS_DIR, 'missing-translations.json');
const EXTRACTED_PATH = path.join(REPORTS_DIR, 'extracted-ui-texts.json');
const ROOT_MISSING_PATH = path.join(process.cwd(), 'missing-translations.json');
const ROOT_EXTRACTED_PATH = path.join(process.cwd(), 'extracted-ui-texts.json');

function readJsonIfExists(paths: string[]): any | null {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
  }
  return null;
}

// POST: Scan codebase to extract UI texts and compute missing translations
export async function POST(req: NextRequest) {
  try {
    const prisma = new PrismaClient();
    const root = process.cwd();
    const srcPath = path.join(root, 'src');
    const extractedOut = ROOT_EXTRACTED_PATH;
    const missingOut = ROOT_MISSING_PATH;

    // Gather files
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: srcPath,
      ignore: ['node_modules/**', '.next/**', 'build/**', 'dist/**', '**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
    });

    // Regex patterns similar to scripts/extract-ui-texts.ts
    const patterns: RegExp[] = [
      /useTranslate\(['"`]([^'"`]+)['"`]\)/g,
      /\bt\(['"`]([^'"`]+)['"`]\)/g,
      />([^<>{}\n]+)</g,
      /placeholder=['"`]([^'"`]+)['"`]/g,
      /title=['"`]([^'"`]+)['"`]/g,
      /alt=['"`]([^'"`]+)['"`]/g,
      /<label[^>]*>([^<]+)</g,
      /<[Bb]utton[^>]*>([^<]+)</g,
      /toast\(\s*{[^}]*title:\s*['"`]([^'"`]+)['"`]/g,
      /toast\(\s*{[^}]*description:\s*['"`]([^'"`]+)['"`]/g,
      /throw new Error\(['"`]([^'"`]+)['"`]\)/g,
      /console\.(log|error|warn)\(['"`]([^'"`]+)['"`]/g,
    ];
    const skipPatterns: RegExp[] = [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      /^\+?[\d\s\-()]+$/,
      /^[A-Z]{2,10}-\d+$/,
      /^https?:\/:\//,
      /^\/[a-zA-Z0-9\/_\-]*$/,
      /^\d+(\.\d+)?\s*(px|em|rem|%|vh|vw)$/,
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}/,
      /^#?[0-9A-Fa-f]{3,6}$/,
      /^[A-Z_]+$/,
      /^[a-z][a-zA-Z0-9]*$/,
      /^[a-z-]+$/,
      /^\d+$/,
      /^[.,;:!?()[\]{}'"´`~@#$%^&*+=|\\<>\/\s]*$/,
    ];

    const extractedSet = new Set<string>();

    for (const rel of files) {
      const filePath = path.join(srcPath, rel);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const pattern of patterns) {
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(content)) !== null) {
            const text = (match[1] || match[2] || '').trim();
            if (!text || text.length < 2) continue;
            if (!/[a-zA-Z]/.test(text)) continue;
            if (skipPatterns.some((p) => p.test(text))) continue;
            extractedSet.add(text);
          }
        }
      } catch {}
    }

    // Save extracted
    const extractedArr = Array.from(extractedSet).sort();
    fs.writeFileSync(
      extractedOut,
      JSON.stringify({ extractedAt: new Date().toISOString(), totalTexts: extractedArr.length, texts: extractedArr }, null, 2)
    );

    // Compute missing vs DB
    const existing = await prisma.translation.findMany({
      where: { targetLang: 'pt' },
      select: { sourceText: true },
    });
    const existingSet = new Set(existing.map((t) => t.sourceText));
    const missingTexts = extractedArr.filter((t) => !existingSet.has(t) && t.length <= 100);
    // Critical missing (simple heuristic)
    const criticalPatterns: RegExp[] = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/,
      /^[A-Z][a-z]+$/,
      /\b(button|form|field|label|title|message|error|success|warning|info)\b/i,
      /\b(create|update|delete|save|cancel|confirm|submit|reset|close|open)\b/i,
      /\b(name|email|phone|address|date|time|price|quantity|total|status)\b/i,
    ];
    const critical = missingTexts.filter((t) => criticalPatterns.some((p) => p.test(t)));

    fs.writeFileSync(
      missingOut,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          totalMissing: missingTexts.length,
          criticalCount: critical.length,
          missingTexts,
          criticalTexts: critical,
        },
        null,
        2
      )
    );

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      extracted: extractedArr.length,
      missing: missingTexts.length,
      critical: critical.length,
    });
  } catch (error) {
    console.error('Coverage refresh error:', error);
    return NextResponse.json({ success: false, error: 'Failed to refresh coverage' }, { status: 500 });
  }
}

function classifyFeature(text: string): string {
  const t = text.toLowerCase();
  if (/(client|clients|contact)/.test(t)) return 'clients';
  if (/(event|calendar|venue|location)/.test(t)) return 'events';
  if (/(quote|orçamento|pdf)/.test(t)) return 'quotes';
  if (/(rental|rentals|prep|check-in|check-out)/.test(t)) return 'rentals';
  if (/(inventory|equipment|item|stock|label)/.test(t)) return 'inventory';
  if (/(maintenance|repair|log)/.test(t)) return 'maintenance';
  if (/(user|profile|password|role|login|sign in|sign up)/.test(t)) return 'users';
  if (/(category|categories|subcategory)/.test(t)) return 'categories';
  if (/(admin|settings|system|translation|branding|logo|favicon)/.test(t)) return 'admin';
  return 'general';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(10, parseInt(searchParams.get('limit') || '100')));
    const group = (searchParams.get('group') || '').toLowerCase();
    const search = (searchParams.get('search') || '').toLowerCase();
    const onlyCritical = (searchParams.get('onlyCritical') || 'false') === 'true';

    let missingTexts: string[] = [];
    let criticalTexts: string[] = [];
    let extractedCount = 0;

    const missing = readJsonIfExists([MISSING_PATH, ROOT_MISSING_PATH]) || {};
    missingTexts = Array.isArray(missing.missingTexts) ? missing.missingTexts : [];
    criticalTexts = Array.isArray(missing.criticalTexts) ? missing.criticalTexts : [];

    const extracted = readJsonIfExists([EXTRACTED_PATH, ROOT_EXTRACTED_PATH]);
    if (extracted) {
      if (Array.isArray(extracted)) {
        extractedCount = extracted.length;
      } else if (Array.isArray(extracted.texts)) {
        extractedCount = extracted.texts.length;
      } else if (extracted?.items && Array.isArray(extracted.items)) {
        extractedCount = extracted.items.length;
      } else if (typeof extracted.totalTexts === 'number') {
        extractedCount = extracted.totalTexts;
      } else {
        extractedCount = Object.keys(extracted || {}).length;
      }
    }

    // Filter by search
    let pool = onlyCritical ? criticalTexts : missingTexts;
    if (search) {
      pool = pool.filter((t) => t.toLowerCase().includes(search));
    }

    // Filter by group
    const groupsSummary: Record<string, number> = {};
    pool.forEach((t) => {
      const g = classifyFeature(t);
      groupsSummary[g] = (groupsSummary[g] || 0) + 1;
    });
    if (group && group !== 'all') {
      pool = pool.filter((t) => classifyFeature(t) === group);
    }

    const total = pool.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = pool.slice(start, start + limit);

    return NextResponse.json(
      {
        missingCount: missingTexts.length,
        extractedCount,
        total,
        page,
        pages,
        items,
        groups: groupsSummary,
        criticalCount: criticalTexts.length,
        topCritical: criticalTexts.slice(0, 50),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Coverage API error:', error);
    return NextResponse.json({ error: 'Failed to load coverage' }, { status: 500 });
  }
}
