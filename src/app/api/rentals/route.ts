import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const RentalSchema = z.object({
  eventId: z.string(),
  equipmentId: z.string(),
  quantityRented: z.number().min(1),
  prepStatus: z.enum(['pending', 'checked-out', 'checked-in']).optional(),
})

// GET /api/rentals - Get all rentals
export async function GET() {
  try {
    const rentals = await prisma.rental.findMany({
      include: {
        event: {
          include: {
            client: true,
          }
        },
        equipment: {
          include: {
            category: true,
            subcategory: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 })
  }
}

// POST /api/rentals - Create new rental
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RentalSchema.parse(body)
    
    const rental = await prisma.rental.create({
      data: validatedData,
      include: {
        event: {
          include: {
            client: true,
          }
        },
        equipment: true,
      },
    })
    
    return NextResponse.json(rental, { status: 201 })
  } catch (error) {
    console.error('Error creating rental:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 })
  }
}

// PUT /api/rentals - Update rental
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 })
    }
    
    const validatedData = RentalSchema.partial().parse(updateData)
    
    const rental = await prisma.rental.update({
      where: { id },
      data: validatedData,
      include: {
        event: {
          include: {
            client: true,
          }
        },
        equipment: true,
      },
    })
    
    return NextResponse.json(rental)
  } catch (error) {
    console.error('Error updating rental:', error)
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 })
  }
}

// DELETE /api/rentals - Delete rental
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 })
    }
    
    await prisma.rental.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rental:', error)
    return NextResponse.json({ error: 'Failed to delete rental' }, { status: 500 })
  }
}