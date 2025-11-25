/**
 * Real-time broadcast helper for API routes
 * This module provides functions to broadcast data changes via Socket.IO
 */

// Type definitions
export interface DataChangeEvent {
  entityType: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: string
}

/**
 * Broadcast data change to all connected clients
 * This function works by accessing the global Socket.IO instance
 */
export function broadcastDataChange(
  entityType: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any,
  excludeUserId?: string
) {
  // Access global Socket.IO instance (set by server.js)
  const io = (global as any).io
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot broadcast data change')
    return
  }

  const event: DataChangeEvent = {
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

  // Log the sync event to database (async, don't block)
  logSyncEvent(entityType, action, data).catch((error) => {
    console.error('Failed to log sync event:', error)
  })
}

/**
 * Send notification to a specific user
 */
export function sendUserNotification(
  userId: string,
  notification: {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    priority?: 'low' | 'medium' | 'high'
    entityType?: string
    entityId?: string
    actionUrl?: string
  }
) {
  const io = (global as any).io
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
  const io = (global as any).io
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
 * Log sync event to database
 */
async function logSyncEvent(
  entityType: string,
  action: string,
  data: any
): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { prisma } = await import('./db-enhanced')
    
    await prisma.dataSyncEvent.create({
      data: {
        entityType,
        action,
        entityId: data?.id || 'unknown',
        data: JSON.stringify(data),
        version: data?.version || 1,
      },
    })
  } catch (error) {
    // Don't throw, just log - this is a non-critical operation
    console.error('Failed to log sync event to database:', error)
  }
}

/**
 * Check if Socket.IO server is available
 */
export function isSocketIOAvailable(): boolean {
  return !!(global as any).io
}

export default {
  broadcastDataChange,
  sendUserNotification,
  broadcastSystemNotification,
  isSocketIOAvailable,
}

