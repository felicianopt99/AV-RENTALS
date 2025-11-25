import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'

// Global Socket.IO instance
let io: SocketIOServer | null = null

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 
              (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '*'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  return io
}

/**
 * Get the Socket.IO server instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io
}

/**
 * Broadcast data change to all clients subscribed to the entity type
 */
export function broadcastDataChange(
  entityType: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any,
  excludeUserId?: string
) {
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot broadcast data change')
    return
  }

  const event = {
    entityType,
    action,
    data,
    timestamp: new Date().toISOString(),
  }

  // Broadcast to all clients in the sync room for this entity type
  const room = `sync-${entityType}`
  if (excludeUserId) {
    // Broadcast to all except the user who made the change
    io.to(room).except(`user-${excludeUserId}`).emit('data-change', event)
  } else {
    io.to(room).emit('data-change', event)
  }
}

/**
 * Send notification to a specific user
 */
export function sendUserNotification(userId: string, notification: {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'medium' | 'high'
  entityType?: string
  entityId?: string
  actionUrl?: string
}) {
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot send notification')
    return
  }

  io.to(`user-${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Broadcast system-wide notification
 */
export function broadcastSystemNotification(notification: {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'medium' | 'high'
}) {
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot broadcast notification')
    return
  }

  io.emit('system-notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount(): number {
  if (!io) return 0
  return io.sockets.sockets.size
}

/**
 * Check if a user is connected
 */
export function isUserConnected(userId: string): boolean {
  if (!io) return false
  const room = io.sockets.adapter.rooms.get(`user-${userId}`)
  return room ? room.size > 0 : false
}

export default {
  initializeSocketIO,
  getSocketIO,
  broadcastDataChange,
  sendUserNotification,
  broadcastSystemNotification,
  getConnectedUsersCount,
  isUserConnected,
}

