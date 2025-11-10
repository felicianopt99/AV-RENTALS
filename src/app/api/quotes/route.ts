import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'


const QuoteItemSchema = z.object({
  type: z.enum(['equipment', 'service', 'fee']),
  // Equipment fields
  equipmentId: z.string().optional(),
  equipmentName: z.string().optional(),
  // Service fields
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  // Fee fields
  feeId: z.string().optional(),
  feeName: z.string().optional(),
  amount: z.number().optional(),
  feeType: z.enum(['fixed', 'percentage']).optional(),
  // Common fields
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  days: z.number().optional(),
  lineTotal: z.number().min(0),
})

const QuoteSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  items: z.array(QuoteItemSchema),
  subTotal: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  discountType: z.enum(['percentage', 'fixed']).default('fixed'),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Archived']).default('Draft'),
  notes: z.string().optional(),
})

// GET /api/quotes - Get all quotes
export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        client: true,
        items: {
          include: {
            equipment: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

// POST /api/quotes - Create new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = QuoteSchema.parse(body)
    
    // Generate quote number
    const currentYear = new Date().getFullYear()
    const existingQuotes = await prisma.quote.findMany({
      where: {
        quoteNumber: {
          startsWith: `Q${currentYear}-`
        }
      },
      orderBy: { quoteNumber: 'desc' },
      take: 1,
    })
    
    let quoteNumber = `Q${currentYear}-001`
    if (existingQuotes.length > 0) {
      const lastNumber = parseInt(existingQuotes[0].quoteNumber.split('-')[1])
      quoteNumber = `Q${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`
    }
    
    const { items, ...quoteData } = validatedData
    
    const quote = await prisma.quote.create({
      data: {
        ...quoteData,
        quoteNumber,
        clientEmail: validatedData.clientEmail || undefined,
        items: {
          create: items,
        },
      },
      include: {
        client: true,
        items: {
          include: {
            equipment: true,
          }
        },
      },
    })
    
    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}

// PUT /api/quotes - Update quote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, items, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }
    
    const validatedData = QuoteSchema.partial().parse({ ...updateData, items })
    
    // Delete existing items and create new ones
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id }
    })
    
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...validatedData,
        clientEmail: validatedData.clientEmail || undefined,
        items: items ? {
          create: items,
        } : undefined,
      },
      include: {
        client: true,
        items: {
          include: {
            equipment: true,
          }
        },
      },
    })
    
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
  }
}

// DELETE /api/quotes - Delete quote
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }
    
    await prisma.quote.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 })
  }
}