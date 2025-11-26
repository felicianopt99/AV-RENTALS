import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/translations/[id]/history - Get translation history entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid translation ID' },
        { status: 400 }
      );
    }

    // Verify translation exists
    const translation = await prisma.translation.findUnique({ where: { id } });
    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }

    const history = await prisma.translationHistory.findMany({
      where: { translationId: id },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get translation history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation history' },
      { status: 500 }
    );
  }
}
