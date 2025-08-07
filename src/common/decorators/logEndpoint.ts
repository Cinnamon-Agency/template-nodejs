import { logger } from '@core/logger'
import { Request, Response, NextFunction } from 'express'

export function logEndpoint() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Try to find Express req/res objects
      const req: Request | undefined = args.find(arg => arg && arg.method && arg.url)
      const res: Response | undefined = args.find(arg => arg && typeof arg.status === 'function' && typeof arg.json === 'function')
      
      if (req) {
        logger.info({
          message: 'Incoming request',
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          params: req.params,
          query: req.query
        })
      }
      let responseData
      try {
        responseData = await originalMethod.apply(this, args)
        logger.info({
          message: 'Outgoing response',
          method: req?.method,
          url: req?.originalUrl,
          response: responseData
        })
        return responseData
      } catch (error) {
        logger.error({
          message: 'Endpoint error',
          method: req?.method,
          url: req?.originalUrl,
          error
        })
        throw error
      }
    }
    return descriptor
  }
}
