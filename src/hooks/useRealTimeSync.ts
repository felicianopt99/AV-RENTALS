'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface DataChangeEvent {
  entityType: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: string
}

interface NotificationEvent {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
}

interface UseRealTimeSyncOptions {
  entityTypes: string[]
  autoConnect?: boolean
  onDataChange?: (event: DataChangeEvent) => void
  onNotification?: (notification: NotificationEvent) => void
  onSystemNotification?: (notification: NotificationEvent) => void
}

export function useRealTimeSync(options: UseRealTimeSyncOptions) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (socket?.connected) return

    const newSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('Real-time sync connected')
      setIsConnected(true)
      setConnectionError(null)
      
      // Join data sync rooms
      newSocket.emit('join-data-sync', options.entityTypes)
      
      // Join user room if we have user context
      const user = localStorage.getItem('currentUser')
      if (user) {
        const userData = JSON.parse(user)
        newSocket.emit('join-user-room', userData.id)
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Real-time sync disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Real-time sync connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    // Handle data changes
    newSocket.on('data-change', (event: DataChangeEvent) => {
      console.log('Data change received:', event)
      options.onDataChange?.(event)
    })

    // Handle user notifications
    newSocket.on('notification', (notification: NotificationEvent) => {
      console.log('Notification received:', notification)
      options.onNotification?.(notification)
    })

    // Handle system notifications
    newSocket.on('system-notification', (notification: NotificationEvent) => {
      console.log('System notification received:', notification)
      options.onSystemNotification?.(notification)
    })

    setSocket(newSocket)
  }, [options])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [socket])

  const emitEvent = useCallback((event: string, data: any) => {
    if (socket?.connected) {
      socket.emit(event, data)
    }
  }, [socket])

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, options.autoConnect])

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    emitEvent,
  }
}

// Hook for managing data with optimistic locking
export function useOptimisticData<T extends { id: string; version: number }>(
  initialData: T[],
  entityType: string
) {
  const [data, setData] = useState<T[]>(initialData)
  const [conflicts, setConflicts] = useState<{ id: string; serverData: T; clientData: T }[]>([])

  const handleDataChange = useCallback((event: DataChangeEvent) => {
    if (event.entityType !== entityType) return

    setData(current => {
      switch (event.action) {
        case 'CREATE':
          return [...current, event.data]
        
        case 'UPDATE':
          return current.map(item => 
            item.id === event.data.id ? event.data : item
          )
        
        case 'DELETE':
          return current.filter(item => item.id !== event.data.id)
        
        default:
          return current
      }
    })
  }, [entityType])

  const updateItem = useCallback(async (
    id: string, 
    updates: Partial<T>, 
    apiEndpoint: string
  ): Promise<{ success: boolean; conflict?: boolean; serverData?: T }> => {
    const currentItem = data.find(item => item.id === id)
    if (!currentItem) {
      throw new Error('Item not found')
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          version: currentItem.version,
          ...updates,
        }),
      })

      if (response.status === 409) {
        // Conflict detected
        const errorData = await response.json()
        return {
          success: false,
          conflict: true,
          serverData: errorData.serverData,
        }
      }

      if (!response.ok) {
        throw new Error('Update failed')
      }

      const updatedItem = await response.json()
      
      // Update local data optimistically
      setData(current => 
        current.map(item => 
          item.id === id ? updatedItem : item
        )
      )

      return { success: true }
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }, [data])

  const resolveConflict = useCallback((id: string, resolution: 'client' | 'server') => {
    const conflict = conflicts.find(c => c.id === id)
    if (!conflict) return

    if (resolution === 'server') {
      setData(current =>
        current.map(item =>
          item.id === id ? conflict.serverData : item
        )
      )
    }

    setConflicts(current => current.filter(c => c.id !== id))
  }, [conflicts])

  // Initialize real-time sync
  useRealTimeSync({
    entityTypes: [entityType],
    onDataChange: handleDataChange,
  })

  return {
    data,
    conflicts,
    updateItem,
    resolveConflict,
    setData,
  }
}

// Hook for paginated data with real-time updates
export function usePaginatedData<T>(
  apiEndpoint: string,
  entityType: string,
  pageSize = 50
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const loadPage = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${apiEndpoint}?page=${pageNum}&pageSize=${pageSize}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to load data')
      }

      const result = await response.json()
      
      setData(current => reset ? result.data : [...current, ...result.data])
      setTotal(result.total)
      setHasMore(pageNum < result.totalPages)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint, pageSize])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(page + 1)
    }
  }, [loading, hasMore, page, loadPage])

  const refresh = useCallback(() => {
    loadPage(1, true)
  }, [loadPage])

  const handleDataChange = useCallback((event: DataChangeEvent) => {
    if (event.entityType !== entityType) return

    setData(current => {
      switch (event.action) {
        case 'CREATE':
          return [event.data, ...current]
        
        case 'UPDATE':
          return current.map(item => 
            (item as any).id === event.data.id ? event.data : item
          )
        
        case 'DELETE':
          return current.filter(item => (item as any).id !== event.data.id)
        
        default:
          return current
      }
    })
  }, [entityType])

  // Initialize real-time sync
  useRealTimeSync({
    entityTypes: [entityType],
    onDataChange: handleDataChange,
  })

  useEffect(() => {
    loadPage(1, true)
  }, [loadPage])

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
  }
}