import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const ClientSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view clients
  const authResult = requireReadAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const clients = await prisma.client.findMany({
      include: {
        events: true,
        quotes: true,
        _count: {
          select: { 
            events: true,
            quotes: true 
          }
        }
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  const authResult = requirePermission(request, 'canManageClients')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const validatedData = ClientSchema.parse(body)
    
    const client = await prisma.client.create({
      data: {
        ...validatedData,
        email: validatedData.email || undefined,
      },
    })
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

// PUT /api/clients - Update client
export async function PUT(request: NextRequest) {
  const authResult = requirePermission(request, 'canManageClients')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    const validatedData = ClientSchema.partial().parse(updateData)
    
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || undefined,
      },
    })
    
    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients - Delete client
export async function DELETE(request: NextRequest) {
  const authResult = requirePermission(request, 'canManageClients')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    await prisma.client.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}