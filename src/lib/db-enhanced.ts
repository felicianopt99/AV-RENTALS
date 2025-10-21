import { PrismaClient } from '@prisma/client'
import pRetry from 'p-retry'
import pLimit from 'p-limit'

// Enhanced database connection with better error handling and concurrency control
class EnhancedPrismaClient extends PrismaClient {
  private concurrencyLimit = pLimit(10) // Limit concurrent database operations
  
  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    })
  }

  // Wrapper for operations with retry logic
  async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    return pRetry(operation, {
      retries: maxRetries,
      onFailedAttempt: (error) => {
        console.warn(`Database operation failed (attempt ${error.attemptNumber}/${maxRetries + 1})`)
      },
    })
  }

  // Wrapper for operations with concurrency limiting
  async withConcurrencyLimit<T>(operation: () => Promise<T>): Promise<T> {
    return this.concurrencyLimit(operation)
  }

  // Enhanced transaction with optimistic locking
  async safeTransaction<T>(
    operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    return this.withRetry(async () => {
      return this.$transaction(operations, {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
      })
    }, maxRetries)
  }

  // Optimistic locking helper
  async updateWithOptimisticLock<T extends { version: number }>(
    model: any,
    id: string,
    data: Partial<T> & { version: number },
    currentVersion: number
  ): Promise<T> {
    return this.withRetry(async () => {
      const result = await model.update({
        where: { 
          id,
          version: currentVersion 
        },
        data: {
          ...data,
          version: currentVersion + 1,
          updatedAt: new Date(),
        },
      })
      
      if (!result) {
        throw new Error('Optimistic lock violation: Record was modified by another user')
      }
      
      return result
    })
  }

  // Paginated query helper
  async findManyPaginated<T>(
    model: any,
    params: {
      where?: any
      orderBy?: any
      page?: number
      pageSize?: number
      select?: any
      include?: any
    }
  ): Promise<{
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const { page = 1, pageSize = 50, where, orderBy, select, include } = params
    
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        select,
        include,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      model.count({ where }),
    ])

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: EnhancedPrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new EnhancedPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connect to database with retry logic
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')
  } catch (error) {
    console.error('Failed to connect to database:', error)
    throw error
  }
}

// Graceful disconnect
export async function disconnectDatabase() {
  await prisma.$disconnect()
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

export type { EnhancedPrismaClient }
export default prisma