import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Service } from '@/types';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, unitPrice, unit, category, isActive } = body;

    if (!name || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Name and unit price are required' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        unitPrice: Number(unitPrice),
        unit: unit || 'hour',
        category: category || null,
        isActive: isActive !== false, // Default to true
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}