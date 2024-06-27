import { Request, Response, NextFunction } from 'express'
import limiter, { IRateLimiterOptions } from 'rate-limiter-flexible'
import config from '../../config'
import { ResponseCode } from '../../interface'

const options: IRateLimiterOptions = {
  points: config.RATE_LIMITER_POINTS,
  duration: config.RATE_LIMITER_DURATION_IN_SECONDS
}

const limiterInMemory = new limiter.RateLimiterMemory(options)

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await limiterInMemory.consume(req.ip!)
    next()
  } catch (error) {
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

const loginLimiterOptions: IRateLimiterOptions = {
  points: config.LOGIN_LIMITER_POINTS,
  duration: config.LOGIN_LIMITER_DURATION_IN_SECONDS,
  blockDuration: config.LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS
}

const loginLimiterInMemory = new limiter.RateLimiterMemory(loginLimiterOptions)

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await loginLimiterInMemory.consume(req.ip!)
    next()
  } catch (error) {
    return next({ code: ResponseCode.TOO_MANY_REQUESTS })
  }
}

export default rateLimiter
