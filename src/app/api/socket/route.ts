import { NextRequest, NextResponse } from 'next/server'
import { isSocketIOAvailable } from '@/lib/realtime-broadcast'

/**
 * Socket.IO health check endpoint
 * The actual Socket.IO server is initialized in server.js
 * This endpoint provides status information about the Socket.IO server
 */
export async function GET(request: NextRequest) {
  try {
    const io = (global as any).io
    const isAvailable = isSocketIOAvailable()
    
    let connectedClients = 0
    if (io) {
      connectedClients = io.sockets.sockets.size
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Socket.IO server status',
      available: isAvailable,
      connectedClients,
      path: '/api/socket',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Socket route error:', error)
    return NextResponse.json(
      { success: false, error: 'Socket status check failed' },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for Socket.IO event handling (if needed)
 * Most Socket.IO communication happens via WebSocket, not HTTP POST
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This endpoint can be used for server-side event triggering
    // For example, triggering a broadcast from an external system
    return NextResponse.json({ 
      success: true, 
      message: 'Socket event endpoint',
      note: 'Socket.IO communication happens via WebSocket at /api/socket',
      data: body
    })
  } catch (error) {
    console.error('Socket POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process socket event' },
      { status: 500 }
    )
  }
}