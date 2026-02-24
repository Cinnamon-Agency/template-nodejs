// Node.js modules
import { Request, Response, NextFunction } from 'express'

// External libraries
import {
  IRateLimiterOptions,
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterAbstract,
} from 'rate-limiter-flexible'
import Redis from 'ioredis'

// Internal modules
import config from '@core/config'
import { ResponseCode } from '@common'
import { logStructured } from '@core/logger'

function createLimiter(options: IRateLimiterOptions): RateLimiterAbstract {
  if (config.REDIS_URL) {
    try {
      const redisClient = new Redis(config.REDIS_URL, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      })

      redisClient.on('error', err => {
        logStructured('error', 'Rate limiter Redis error', {
          error: err.message,
          stack: err.stack,
        })
      })

      return new RateLimiterRedis({
        storeClient: redisClient,
        ...options,
      })
    } catch (err) {
      logStructured('warn', 'Failed to connect to Redis for rate limiting, falling back to in-memory', {
        error: err instanceof Error ? err.message : String(err),
      })
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

// Additional specialized limiters
const passwordResetLimiter = createLimiter({
  keyPrefix: 'rl_password_reset',
  points: 3, // 3 attempts
  duration: 900, // per 15 minutes
  blockDuration: 1800, // block for 30 minutes
})

const verificationLimiter = createLimiter({
  keyPrefix: 'rl_verification',
  points: 5, // 5 attempts
  duration: 3600, // per hour
  blockDuration: 3600, // block for 1 hour
})

const uploadLimiter = createLimiter({
  keyPrefix: 'rl_upload',
  points: 10, // 10 uploads
  duration: 3600, // per hour
})

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await generalLimiter.consume(req.ip!)
    next()
  } catch (rejRes) {
    logStructured('warn', 'Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      remainingPoints: (rejRes as { remainingPoints?: number })?.remainingPoints || 0,
      msBeforeNext: (rejRes as { msBeforeNext?: number })?.msBeforeNext || 0,
    })
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
  } catch (rejRes) {
    logStructured('warn', 'Login rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      remainingPoints: (rejRes as { remainingPoints?: number })?.remainingPoints || 0,
      msBeforeNext: (rejRes as { msBeforeNext?: number })?.msBeforeNext || 0,
    })
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

export const passwordResetRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await passwordResetLimiter.consume(req.ip!)
    next()
  } catch (rejRes) {
    logStructured('warn', 'Password reset rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      remainingPoints: (rejRes as { remainingPoints?: number })?.remainingPoints || 0,
      msBeforeNext: (rejRes as { msBeforeNext?: number })?.msBeforeNext || 0,
    })
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

export const verificationRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await verificationLimiter.consume(req.ip!)
    next()
  } catch (rejRes) {
    logStructured('warn', 'Verification rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      remainingPoints: (rejRes as { remainingPoints?: number })?.remainingPoints || 0,
      msBeforeNext: (rejRes as { msBeforeNext?: number })?.msBeforeNext || 0,
    })
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

export const uploadRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await uploadLimiter.consume(req.ip!)
    next()
  } catch (rejRes) {
    logStructured('warn', 'Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      remainingPoints: (rejRes as { remainingPoints?: number })?.remainingPoints || 0,
      msBeforeNext: (rejRes as { msBeforeNext?: number })?.msBeforeNext || 0,
    })
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

// User-specific rate limiter (for authenticated endpoints)
export const createUserRateLimiter = (options: IRateLimiterOptions) => {
  const limiter = createLimiter({
    keyPrefix: 'rl_user',
    ...options,
  })

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as Request & { user?: { id: string } }).user?.id
    const key = userId ? `user_${userId}` : req.ip

    try {
      await limiter.consume(key!)
      next()
    } catch (rejRes) {
      logStructured('warn', 'User rate limit exceeded', {
        userId,
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        remainingPoints: (rejRes as { remainingPoints?: number })?.remainingPoints || 0,
        msBeforeNext: (rejRes as { msBeforeNext?: number })?.msBeforeNext || 0,
      })
      return next({ code: ResponseCode.TOO_MANY_REQUESTS })
    }
  }
}

export default rateLimiter
