import { Request } from 'express'
import morgan from 'morgan'
import { httpLogger } from '../../logger'

export const requestLogger = morgan(
  function (tokens, req: Request, res) {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      code: tokens.status(req, res),
      content_length: tokens.res(req, res, 'content-length'),
      response_time: tokens['response-time'](req, res) + ' ms'
      // user_id: req.user?.id || "null",
    })
  },
  {
    stream: {
      write: (message) => {
        const data = JSON.parse(message)
        httpLogger.http(`incoming-request`, data)
      }
    }
  }
)
