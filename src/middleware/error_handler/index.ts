import { NextFunction, Request, Response } from 'express'
import { ResponseCode, ResponseMessage, ResponseError } from '@common'
import { logger } from '@core/logger'

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err)
  }

  // Handle ResponseError (thrown by validation middleware, etc.)
  if (err instanceof ResponseError) {
    const status = parseFloat(err.code.toString().substring(0, 3))
    return res.status(status).send({
      data: null,
      code: err.code,
      message: err.message,
    })
  }

  // Handle unexpected errors
  logger.error({
    message: 'Unhandled error',
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  })

  return res.status(500).send({
    data: null,
    code: ResponseCode.SERVER_ERROR,
    message: ResponseMessage.SERVER_ERROR,
  })
}
