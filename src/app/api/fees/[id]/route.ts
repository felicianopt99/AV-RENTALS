
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
    }
    await prisma.fee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fee:', error);
    return NextResponse.json({ error: 'Failed to delete fee' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, amount, type, category, isActive, isRequired } = body;
    if (!id) {
      return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
    }
    const fee = await prisma.fee.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        type: type || undefined,
        category: category !== undefined ? category : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isRequired: isRequired !== undefined ? isRequired : undefined,
      },
    });
    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error updating fee:', error);
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 });
  }
}