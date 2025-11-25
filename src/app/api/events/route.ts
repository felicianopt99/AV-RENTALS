import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const EventSchema = z.object({
  name: z.string().min(1),
  clientId: z.string(),
  location: z.string().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
})

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view events
  const authResult = requireReadAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const events = await prisma.event.findMany({
      include: {
        client: true,
        rentals: {
          include: {
            equipment: true,
          }
        },
        _count: {
          select: { rentals: true }
        }
      },
      orderBy: { startDate: 'desc' },
    })
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  const authResult = requirePermission(request, 'canManageEvents')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const validatedData = EventSchema.parse(body)
    
    const event = await prisma.event.create({
      data: validatedData,
      include: {
        client: true,
        rentals: true,
      },
    })
    
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// PUT /api/events - Update event
export async function PUT(request: NextRequest) {
  const authResult = requirePermission(request, 'canManageEvents')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    const validatedData = EventSchema.partial().parse(updateData)
    
    const event = await prisma.event.update({
      where: { id },
      data: validatedData,
      include: {
        client: true,
        rentals: true,
      },
    })
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/events - Delete event
export async function DELETE(request: NextRequest) {
  const authResult = requirePermission(request, 'canManageEvents')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    await prisma.event.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}