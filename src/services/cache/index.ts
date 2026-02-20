import config from '@core/config'
import { logger } from '@core/logger'
import Redis from 'ioredis'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

let redisClient: Redis | null = null

if (config.REDIS_URL) {
  try {
    redisClient = new Redis(config.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
    redisClient.on('error', err => {
      logger.error('Cache Redis error:', err)
    })
  } catch {
    logger.warn('Failed to connect to Redis for caching, using in-memory')
  }
}

const memoryStore = new Map<string, CacheEntry<unknown>>()

const MEMORY_CACHE_CLEANUP_INTERVAL = 60 * 1000 // 1 minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key)
    }
  }
}, MEMORY_CACHE_CLEANUP_INTERVAL)

export const cache = {
  /**
   * Get a value from cache. Returns null if not found or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    if (redisClient) {
      try {
        const raw = await redisClient.get(key)
        if (!raw) return null
        return JSON.parse(raw) as T
      } catch {
        // fall through to memory
      }
    }

    const entry = memoryStore.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      memoryStore.delete(key)
      return null
    }
    return entry.value
  },

  /**
   * Set a value in cache with a TTL in seconds.
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds)
        return
      } catch {
        // fall through to memory
      }
    }

    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  },

  /**
   * Delete a key from cache (use after mutations).
   */
  async del(key: string): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.del(key)
      } catch {
        // ignore
      }
    }
    memoryStore.delete(key)
  },

  /**
   * Delete all keys matching a prefix pattern.
   * Only works with Redis; in-memory does a linear scan.
   */
  async delByPrefix(prefix: string): Promise<void> {
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`${prefix}*`)
        if (keys.length > 0) {
          await redisClient.del(...keys)
        }
      } catch {
        // ignore
      }
    }

    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        memoryStore.delete(key)
      }
    }
  },
}

// Cache key builders
export const CacheKeys = {
  userById: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  roleByType: (type: string) => `role:${type}`,
}

// Default TTLs in seconds
export const CacheTTL = {
  USER: 300, // 5 minutes
  ROLE: 3600, // 1 hour (roles rarely change)
}
