import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'

// Dynamic import for Prisma (handles both dev and production)
let prisma
async function getPrisma() {
  if (prisma) return prisma
  
  try {
    // Try production build path first (standalone mode)
    try {
      const dbModule = await import('./.next/standalone/src/lib/db-enhanced.js')
      if (dbModule && dbModule.prisma) {
        prisma = dbModule.prisma
        return prisma
      }
    } catch (e) {
      // Not in production build, try dev path
    }
    
    // Try dev path
    const dbModule = await import('./src/lib/db-enhanced.js')
    if (dbModule && dbModule.prisma) {
      prisma = dbModule.prisma
      return prisma
    }
    
    throw new Error('Prisma not found in module')
  } catch (error) {
    console.error('Failed to import Prisma:', error)
    // Return a mock prisma to prevent crashes, but log the error
    return null
  }
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Socket.IO authentication middleware
async function authenticateSocket(socket, next) {
  try {
    // Try to get token from handshake auth
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  socket.handshake.query?.token

    if (!token) {
      // Allow connection without auth, but mark as unauthenticated
      socket.data.authenticated = false
      return next()
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // Get Prisma instance
      const db = await getPrisma()
      if (!db) {
        socket.data.authenticated = false
        return next()
      }
      
      // Get user from database
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
        },
      })

      if (!user || !user.isActive) {
        socket.data.authenticated = false
        return next()
      }

      // Attach user data to socket
      socket.data.authenticated = true
      socket.data.userId = user.id
      socket.data.username = user.username
      socket.data.role = user.role
      
      next()
    } catch (error) {
      // Invalid token, but allow connection as unauthenticated
      socket.data.authenticated = false
      next()
    }
  } catch (error) {
    console.error('Socket authentication error:', error)
    socket.data.authenticated = false
    next()
  }
}

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO server
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || (dev ? 'http://localhost:3000' : '*'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Socket.IO authentication middleware
  io.use(authenticateSocket)

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    const userId = socket.data.userId
    const username = socket.data.username || 'Anonymous'
    const authenticated = socket.data.authenticated

    console.log(`Socket connected: ${socket.id} (User: ${username}, Authenticated: ${authenticated})`)

    // Join user-specific room if authenticated
    if (authenticated && userId) {
      socket.join(`user-${userId}`)
      console.log(`User ${username} joined room: user-${userId}`)
    }

    // Handle joining data sync rooms
    socket.on('join-data-sync', (entityTypes) => {
      if (!Array.isArray(entityTypes)) {
        console.warn('Invalid entityTypes provided to join-data-sync')
        return
      }

      entityTypes.forEach((entityType) => {
        if (typeof entityType === 'string') {
          socket.join(`sync-${entityType}`)
          console.log(`Socket ${socket.id} joined sync room: sync-${entityType}`)
        }
      })
    })

    // Handle joining user room (for notifications)
    socket.on('join-user-room', (userId) => {
      if (typeof userId === 'string' && userId) {
        socket.join(`user-${userId}`)
        console.log(`Socket ${socket.id} joined user room: user-${userId}`)
      }
    })

    // Handle user activity tracking
    socket.on('user:activity', (data) => {
      if (authenticated && userId) {
        // Broadcast activity to other users (optional)
        socket.broadcast.emit('user:activity', {
          userId,
          username,
          ...data,
          timestamp: new Date().toISOString(),
        })
      }
    })

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (User: ${username}, Reason: ${reason})`)
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error)
    })
  })

  // Make io available globally for use in API routes
  global.io = io

  // Helper function to broadcast data changes
  global.broadcastDataChange = (entityType, action, data, excludeUserId = null) => {
    const event = {
      entityType,
      action,
      data,
      timestamp: new Date().toISOString(),
    }

    // Broadcast to all clients in the sync room for this entity type
    io.to(`sync-${entityType}`).emit('data-change', event)

    // Log the sync event to database (async, don't block)
    getPrisma()
      .then((db) => {
        return db.dataSyncEvent.create({
          data: {
            entityType,
            action,
            entityId: data?.id || 'unknown',
            data: JSON.stringify(data),
            version: data?.version || 1,
          },
        })
      })
      .catch((error) => {
        console.error('Failed to log sync event:', error)
      })
  }

  // Helper function to send user notification
  global.sendUserNotification = (userId, notification) => {
    io.to(`user-${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    })
  }

  // Helper function to broadcast system notification
  global.broadcastSystemNotification = (notification) => {
    io.emit('system-notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    })
  }

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.IO server initialized on /api/socket`)
    })
})

