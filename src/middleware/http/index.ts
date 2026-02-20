import { Request, Response } from 'express'
import morgan from 'morgan'
import { httpLogger } from '@core/logger'

export const requestLogger = morgan(
  function (tokens, req: Request, res: Response) {
    const status = tokens.status(req, res)
    const statusCode = status ? parseInt(status) : 0

    return JSON.stringify({
      request_id: req.requestId || null,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: statusCode,
      content_length: tokens.res(req, res, 'content-length'),
      response_time: tokens['response-time'](req, res),
      user_id: req.user?.id || null,
      ip: tokens['remote-addr'](req, res),
      user_agent: tokens['user-agent'](req, res),
      referrer: tokens.referrer(req, res),
    })
  },
  {
    stream: {
      write: message => {
        const data = JSON.parse(message)
        
        // Log errors (4xx, 5xx) at error level, others at http level
        if (data.status >= 400) {
          httpLogger.error('HTTP Error', data)
        } else {
          httpLogger.http('HTTP Request', data)
        }
      },
    },
    // Skip logging for healthcheck endpoint to reduce noise
    skip: (req: Request) => req.url === '/api/v1/healthcheck',
  }
)
