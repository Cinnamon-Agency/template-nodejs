import { logger } from '@core/logger'
import { sendLogEvents } from '@services/cloudwatch'
import { Request } from 'express'

export function logEndpoint() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const req: Request | undefined = args.find(arg => arg && arg.method && arg.url)
      
      if (req) {
        const logData = {
          message: 'Incoming request',
          method: req.method,
          url: req.originalUrl,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query
        }
        logger.info(logData)
        sendLogEvents(JSON.stringify(logData))
      }
      let responseData
      try {
        responseData = await originalMethod.apply(this, args)
        const responseLogData = {
          message: 'Outgoing response',
          method: req?.method,
          url: req?.originalUrl,
          path: req?.path,
          response: responseData
        }
        logger.info(responseLogData)
        sendLogEvents(JSON.stringify(responseLogData))
        return responseData
      } catch (error) {
        const errorLogData = {
          message: 'Endpoint error',
          method: req?.method,
          url: req?.originalUrl,
          path: req?.path,
          body: req?.body,
          error: error instanceof Error ? error.stack || error.message : error
        }
        logger.error(errorLogData)
        sendLogEvents(JSON.stringify(errorLogData))
        throw error
      }
    }
    return descriptor
  }
}
