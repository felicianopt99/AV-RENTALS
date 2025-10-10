import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { prisma } from '@/lib/db-enhanced'

export interface NextApiResponseServerIO extends Response {
  socket: {
    server: NetServer & {
      io?: ServerIO
    }
  }
}

// Real-time data synchronization service
class RealTimeSync {
  private io: ServerIO | null = null
  
  initialize(server: NetServer) {
    if (!this.io) {
      this.io = new ServerIO(server, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          methods: ['GET', 'POST'],
        },
      })

      this.setupEventHandlers()
    }
    return this.io
  }

  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Join user to their personal room for notifications
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`)
      })

      // Join user to data sync rooms
      socket.on('join-data-sync', (entityTypes: string[]) => {
        entityTypes.forEach(type => {
          socket.join(`sync-${type}`)
        })
      })

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`)
      })
    })
  }

  // Broadcast data changes to all connected clients
  broadcastDataChange(entityType: string, action: 'CREATE' | 'UPDATE' | 'DELETE', data: any) {
    if (!this.io) return

    this.io.to(`sync-${entityType}`).emit('data-change', {
      entityType,
      action,
      data,
      timestamp: new Date().toISOString(),
    })

    // Log the sync event
    this.logSyncEvent(entityType, action, data)
  }

  // Send notification to specific user
  sendUserNotification(userId: string, notification: any) {
    if (!this.io) return

    this.io.to(`user-${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    })
  }

  // Broadcast system-wide notification
  broadcastSystemNotification(notification: any) {
    if (!this.io) return

    this.io.emit('system-notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    })
  }

  private async logSyncEvent(entityType: string, action: string, data: any) {
    try {
      await prisma.dataSyncEvent.create({
        data: {
          entityType,
          action,
          entityId: data.id || 'unknown',
          data: JSON.stringify(data),
          version: data.version || 1,
        },
      })
    } catch (error) {
      console.error('Failed to log sync event:', error)
    }
  }

  getIO() {
    return this.io
  }
}

// Singleton instance
export const realTimeSync = new RealTimeSync()

// Helper function to emit data changes with optimistic locking check
export async function emitDataChange(
  entityType: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any,
  userId?: string
) {
  // Broadcast the change
  realTimeSync.broadcastDataChange(entityType, action, data)

  // Log user activity
  if (userId) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId: data.id,
          newData: JSON.stringify(data),
        },
      })
    } catch (error) {
      console.error('Failed to log user activity:', error)
    }
  }
}

// Data conflict resolution
export interface ConflictResolution {
  strategy: 'latest-wins' | 'merge' | 'user-choice'
  resolvedData?: any
  requiresUserInput?: boolean
}

export async function resolveDataConflict(
  entityType: string,
  entityId: string,
  clientVersion: number,
  newData: any
): Promise<ConflictResolution> {
  try {
    // Get current version from database
    const currentData = await (prisma as any)[entityType.toLowerCase()].findUnique({
      where: { id: entityId },
    })

    if (!currentData) {
      throw new Error('Entity not found')
    }

    if (currentData.version === clientVersion) {
      // No conflict
      return { strategy: 'latest-wins' }
    }

    // Conflict detected - for now, use latest-wins strategy
    // In a more sophisticated system, you could implement merge strategies
    console.warn(`Data conflict detected for ${entityType} ${entityId}: client version ${clientVersion}, server version ${currentData.version}`)
    
    return {
      strategy: 'latest-wins',
      resolvedData: currentData,
      requiresUserInput: true,
    }
  } catch (error) {
    console.error('Error resolving data conflict:', error)
    throw error
  }
}

export default realTimeSync