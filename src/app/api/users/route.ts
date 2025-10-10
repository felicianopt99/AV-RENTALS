import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Manager', 'Technician', 'Employee', 'Viewer']),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['Admin', 'Manager', 'Technician', 'Employee', 'Viewer']).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, username, password, role } = createUserSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12)
    }
    
    const validatedData = updateUserSchema.parse(updateData)
    
    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    await prisma.user.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}