import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db-enhanced'
import { emitDataChange } from '@/lib/realtime-sync'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import fs from 'fs/promises'
import path from 'path'

const EquipmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
  quantity: z.number().min(0),
  status: z.enum(['good', 'damaged', 'maintenance']),
  location: z.string().min(1),
  imageUrl: z.string().optional(),
  dailyRate: z.number().min(0),
  type: z.enum(['equipment', 'consumable']),
  version: z.number().optional(),
})

// Utility function to download and save image locally
async function downloadImage(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image');
    }

    const buffer = await response.arrayBuffer();
    const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const filename = `equipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;
    const filepath = path.join(process.cwd(), 'public', 'images', filename);

    await fs.writeFile(filepath, Buffer.from(buffer));
    return `/images/${filename}`;
  } catch (error) {
    console.error('Failed to download image:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}

// Helper function to get user from token
function getUserFromRequest(request: NextRequest): { userId: string; username: string } | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return { userId: decoded.userId, username: decoded.username }
  } catch {
    return null
  }
}

// GET /api/equipment - Get equipment with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.equipmentItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          subcategory: true,
          maintenanceLogs: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.equipmentItem.count({ where }),
    ])

    const result = {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let validatedData = EquipmentSchema.parse(body)
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Download image if external URL provided
    if (validatedData.imageUrl && validatedData.imageUrl.startsWith('http')) {
      validatedData.imageUrl = await downloadImage(validatedData.imageUrl);
    }

    const equipment = await prisma.$transaction(async (tx) => {
      const newEquipment = await tx.equipmentItem.create({
        data: {
          ...validatedData,
          imageUrl: validatedData.imageUrl || 'https://placehold.co/600x400.png',
          createdBy: user.userId,
          updatedBy: user.userId,
        },
        include: {
          category: true,
          subcategory: true,
          maintenanceLogs: true,
        },
      })

      return newEquipment
    })

    // Emit real-time update
    await emitDataChange('EquipmentItem', 'CREATE', equipment, user.userId)
    
    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 })
  }
}

// PUT /api/equipment - Update equipment with optimistic locking
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, version, ...updateData } = body
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    let validatedData = EquipmentSchema.partial().parse(updateData)

    // Download image if external URL provided
    if (validatedData.imageUrl && validatedData.imageUrl.startsWith('http')) {
      validatedData.imageUrl = await downloadImage(validatedData.imageUrl);
    }
    
    try {
      // Get current version first
      const currentItem = await prisma.equipmentItem.findUnique({
        where: { id },
        select: { version: true }
      })

      if (!currentItem) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
      }

      if (version && currentItem.version !== version) {
        return NextResponse.json({ 
          error: 'Conflict detected', 
          message: 'This record was modified by another user. Please refresh and try again.',
          serverVersion: currentItem.version
        }, { status: 409 })
      }

      const equipment = await prisma.equipmentItem.update({
        where: { id },
        data: {
          ...validatedData,
          updatedBy: user.userId,
          version: currentItem.version + 1,
        },
        include: {
          category: true,
          subcategory: true,
          maintenanceLogs: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      })

      // Emit real-time update
      await emitDataChange('EquipmentItem', 'UPDATE', equipment, user.userId)
      
      return NextResponse.json(equipment)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating equipment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 })
  }
}

// DELETE /api/equipment - Delete equipment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }
    
    // Get the equipment before deletion for real-time sync
    const equipment = await prisma.equipmentItem.findUnique({
      where: { id },
      include: { category: true, subcategory: true }
    })
    
    await prisma.$transaction(async (tx) => {
      await tx.equipmentItem.delete({
        where: { id },
      })
    })

    // Emit real-time update
    if (equipment) {
      await emitDataChange('EquipmentItem', 'DELETE', { ...equipment }, user.userId)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipment:', error)
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 })
  }
}