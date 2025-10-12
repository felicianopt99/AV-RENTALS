import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

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

// GET /api/users/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
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

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT /api/users/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const photo = formData.get('photo') as File | null
    const nif = formData.get('nif') as string || undefined
    const iban = formData.get('iban') as string || undefined
    const contactPhone = formData.get('contactPhone') as string || undefined
    const contactEmail = formData.get('contactEmail') as string || undefined
    const emergencyPhone = formData.get('emergencyPhone') as string || undefined

    // Handle photo upload if provided
    let photoUrl: string | undefined = undefined
    if (photo) {
      // Save photo to public/images/users/
      const usersDir = path.join(process.cwd(), 'public', 'images', 'users')
      if (!fs.existsSync(usersDir)) {
        fs.mkdirSync(usersDir, { recursive: true })
      }
      const fileName = `${user.userId}.jpg` // Assume jpg for simplicity
      const filePath = path.join(usersDir, fileName)
      const buffer = Buffer.from(await photo.arrayBuffer())
      fs.writeFileSync(filePath, buffer)
      photoUrl = `/images/users/${fileName}`
    }

    const updatedProfile = await prisma.user.update({
      where: { id: user.userId },
      data: {
        photoUrl,
        nif,
        iban,
        contactPhone,
        contactEmail,
        emergencyPhone,
        updatedBy: user.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
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

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
