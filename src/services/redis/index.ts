import Redis from 'ioredis'
import config from '@core/config'
import { logger } from '@core/logger'

let sharedRedisClient: Redis | null = null

/**
 * Returns a shared Redis client instance.
 * All consumers (cache, rate limiter, etc.) should use this
 * instead of creating their own connections.
 * Returns null if REDIS_URL is not configured.
 */
export function getRedisClient(): Redis | null {
  if (!config.REDIS_URL) {
    return null
  }

  if (!sharedRedisClient) {
    try {
      sharedRedisClient = new Redis(config.REDIS_URL, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      })

      sharedRedisClient.on('error', err => {
        logger.error('Shared Redis client error:', err)
      })
    } catch (err) {
      logger.warn('Failed to connect to Redis, falling back to in-memory', {
        error: err instanceof Error ? err.message : String(err),
      })
      sharedRedisClient = null
    }
  }

  return sharedRedisClient
}
