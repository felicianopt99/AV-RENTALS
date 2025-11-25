import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { clearTranslationCache } from '@/lib/translation';

const RULES_PATH = path.resolve(process.cwd(), 'translation-rules.json');

export async function GET(req: NextRequest) {
  try {
    const data = fs.readFileSync(RULES_PATH, 'utf-8');
    return new NextResponse(data, { status: 200 });
  } catch (e: any) {
    return new NextResponse('Failed to read rules', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.text();
    // Validate JSON
    JSON.parse(body);
    fs.writeFileSync(RULES_PATH, body, 'utf-8');
    // Invalidate translation cache so new rules apply immediately
    clearTranslationCache();
    return new NextResponse('Rules updated', { status: 200 });
  } catch (e: any) {
    return new NextResponse('Invalid JSON or write error', { status: 400 });
  }
}
