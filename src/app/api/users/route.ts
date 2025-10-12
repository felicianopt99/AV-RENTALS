import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/types'

const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Manager', 'Technician', 'Employee', 'Viewer']),
  // Profile fields optional
  photoUrl: z.string().optional(),
  nif: z.string().optional(),
  iban: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['Admin', 'Manager', 'Technician', 'Employee', 'Viewer']).optional(),
  isActive: z.boolean().optional(),
  // Profile fields optional
  photoUrl: z.string().optional(),
  nif: z.string().optional(),
  iban: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

// Helper function to get user from token
function getUserFromRequest(request: NextRequest): { userId: string; username: string; role: string } | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return { userId: decoded.userId, username: decoded.username, role: decoded.role }
  } catch {
    return null
  }
}

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
        // Profile fields
        photoUrl: true,
        nif: true,
        iban: true,
        contactPhone: true,
        contactEmail: true,
        emergencyPhone: true,
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
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role as UserRole, 'canManageUsers')) {
      return NextResponse.json({ error: 'Forbidden: Only admins can manage users' }, { status: 403 })
    }

    const body = await request.json()
    const { name, username, password, role, photoUrl, nif, iban, contactPhone, contactEmail, emergencyPhone } = createUserSchema.parse(body)

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

    const data: any = {
      name,
      username,
      password: hashedPassword,
      role,
      createdBy: user.userId,
      updatedBy: user.userId,
    }

    if (photoUrl !== undefined) data.photoUrl = photoUrl
    if (nif !== undefined) data.nif = nif
    if (iban !== undefined) data.iban = iban
    if (contactPhone !== undefined) data.contactPhone = contactPhone
    if (contactEmail !== undefined) data.contactEmail = contactEmail
    if (emergencyPhone !== undefined) data.emergencyPhone = emergencyPhone

    const userCreated = await prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        // Profile fields
        photoUrl: true,
        nif: true,
        iban: true,
        contactPhone: true,
        contactEmail: true,
        emergencyPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(userCreated, { status: 201 })
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
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const userUpdated = await prisma.user.update({
      where: { id },
      data: {
        ...validatedData,
        updatedBy: user.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        // Profile fields
        photoUrl: true,
        nif: true,
        iban: true,
        contactPhone: true,
        contactEmail: true,
        emergencyPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(userUpdated)
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
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
