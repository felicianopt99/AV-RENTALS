import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const RentalSchema = z.object({
  eventId: z.string(),
  equipment: z.array(
    z.object({
      equipmentId: z.string(),
      quantity: z.number().min(1),
    })
  ).min(1),
  notes: z.string().optional(),
})

const SingleRentalUpdateSchema = z.object({
  eventId: z.string().optional(),
  equipmentId: z.string().optional(),
  quantityRented: z.number().min(1).optional(),
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

// POST /api/rentals - Create new rentals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RentalSchema.parse(body)

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const rentals = []
    for (const item of validatedData.equipment) {
      // Check if equipment exists
      const equipment = await prisma.equipmentItem.findUnique({
        where: { id: item.equipmentId },
      })
      if (!equipment) {
        return NextResponse.json({ error: `Equipment ${item.equipmentId} not found` }, { status: 404 })
      }

      const rental = await prisma.rental.create({
        data: {
          eventId: validatedData.eventId,
          equipmentId: item.equipmentId,
          quantityRented: item.quantity,
        },
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
      })
      rentals.push(rental)
    }

    return NextResponse.json(rentals, { status: 201 })
  } catch (error) {
    console.error('Error creating rentals:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create rentals' }, { status: 500 })
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
    
    const validatedData = SingleRentalUpdateSchema.parse(updateData)
    
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