import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api-auth'
import { generateAllNotifications } from '@/lib/notifications'

// POST /api/notifications/generate - Admin-only trigger
export async function POST(request: NextRequest) {
  const authResult = requirePermission(request, 'canViewReports')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    await generateAllNotifications()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error running notification generators:', error)
    return NextResponse.json({ error: 'Failed to generate notifications' }, { status: 500 })
  }
}
