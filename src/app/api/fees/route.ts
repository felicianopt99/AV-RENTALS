import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Fee } from '@/types';

export async function GET() {
  try {
    const fees = await prisma.fee.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, amount, type, category, isActive, isRequired } = body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Name and amount are required' },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.create({
      data: {
        name,
        description: description || null,
        amount: Number(amount),
        type: type || 'fixed',
        category: category || null,
        isActive: isActive !== false, // Default to true
        isRequired: isRequired === true, // Default to false
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error('Error creating fee:', error);
    return NextResponse.json(
      { error: 'Failed to create fee' },
      { status: 500 }
    );
  }
}