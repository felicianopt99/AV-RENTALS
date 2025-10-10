import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const SubcategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string(),
})

// GET /api/subcategories - Get all subcategories
export async function GET() {
  try {
    const subcategories = await prisma.subcategory.findMany({
      include: {
        category: true,
        _count: {
          select: { equipment: true }
        }
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
  }
}

// POST /api/subcategories - Create new subcategory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SubcategorySchema.parse(body)
    
    const subcategory = await prisma.subcategory.create({
      data: validatedData,
      include: {
        category: true,
      },
    })
    
    return NextResponse.json(subcategory, { status: 201 })
  } catch (error) {
    console.error('Error creating subcategory:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 })
  }
}

// PUT /api/subcategories - Update subcategory
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 })
    }
    
    const validatedData = SubcategorySchema.partial().parse(updateData)
    
    const subcategory = await prisma.subcategory.update({
      where: { id },
      data: validatedData,
      include: {
        category: true,
      },
    })
    
    return NextResponse.json(subcategory)
  } catch (error) {
    console.error('Error updating subcategory:', error)
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 })
  }
}

// DELETE /api/subcategories - Delete subcategory
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 })
    }
    
    await prisma.subcategory.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 })
  }
}