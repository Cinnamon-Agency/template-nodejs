import { Request, Response, NextFunction } from 'express'
import {
  IRateLimiterOptions,
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterAbstract,
} from 'rate-limiter-flexible'
import config from '@core/config'
import { ResponseCode } from '@common'
import { logger } from '@core/logger'
import Redis from 'ioredis'

function createLimiter(options: IRateLimiterOptions): RateLimiterAbstract {
  if (config.REDIS_URL) {
    try {
      const redisClient = new Redis(config.REDIS_URL, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      })

      redisClient.on('error', err => {
        logger.error('Rate limiter Redis error:', err)
      })

      return new RateLimiterRedis({
        storeClient: redisClient,
        ...options,
      })
    } catch (err) {
      logger.warning(
        'Failed to connect to Redis for rate limiting, falling back to in-memory:',
        err
      )
    }
  }

  return new RateLimiterMemory(options)
}

const generalLimiter = createLimiter({
  keyPrefix: 'rl_general',
  points: config.RATE_LIMITER_POINTS,
  duration: config.RATE_LIMITER_DURATION_IN_SECONDS,
})

const loginLimiter = createLimiter({
  keyPrefix: 'rl_login',
  points: config.LOGIN_LIMITER_POINTS,
  duration: config.LOGIN_LIMITER_DURATION_IN_SECONDS,
  blockDuration: config.LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS,
})

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await generalLimiter.consume(req.ip!)
    next()
  } catch {
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await loginLimiter.consume(req.ip!)
    next()
  } catch {
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

export default rateLimiter
