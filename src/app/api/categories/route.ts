import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const CategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
})

// GET /api/categories - Get all categories with subcategories
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view categories
  const authResult = requireReadAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
        _count: {
          select: { equipment: true }
        }
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  // Categories are part of equipment management
  const authResult = requirePermission(request, 'canManageEquipment')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const validatedData = CategorySchema.parse(body)
    
    const category = await prisma.category.create({
      data: validatedData,
      include: {
        subcategories: true,
      },
    })
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT /api/categories - Update category
export async function PUT(request: NextRequest) {
  // Categories are part of equipment management
  const authResult = requirePermission(request, 'canManageEquipment')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    
    const validatedData = CategorySchema.partial().parse(updateData)
    
    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
      include: {
        subcategories: true,
      },
    })
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/categories - Delete category
export async function DELETE(request: NextRequest) {
  // Categories are part of equipment management
  const authResult = requirePermission(request, 'canManageEquipment')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    
    // Check if category has equipment
    const equipmentCount = await prisma.equipmentItem.count({
      where: { categoryId: id }
    })
    
    if (equipmentCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with equipment items' 
      }, { status: 400 })
    }
    
    await prisma.category.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}