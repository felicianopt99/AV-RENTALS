import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/types'

export interface AuthUser {
  userId: string
  username: string
  role: UserRole
}

/**
 * Extracts user information from JWT token in request cookies
 */
export function getUserFromRequest(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role as UserRole,
    }
  } catch {
    return null
  }
}

/**
 * Requires authentication for an API route
 * Returns the authenticated user or a 401 response
 */
export function requireAuth(request: NextRequest): AuthUser | NextResponse {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

/**
 * Requires a specific permission for an API route
 * Returns the authenticated user or an error response (401/403)
 */
export function requirePermission(
  request: NextRequest,
  permission: keyof import('@/types').RolePermissions
): AuthUser | NextResponse {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(user.role, permission)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return user
}

/**
 * Checks if the request has read access (any authenticated user can read)
 * For write operations, use requirePermission instead
 */
export function requireReadAccess(request: NextRequest): AuthUser | NextResponse {
  return requireAuth(request)
}

