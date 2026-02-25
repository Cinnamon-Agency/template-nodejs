// Node.js modules
import { NextFunction, Request, Response } from 'express'

// Internal modules
import { ResponseCode, ResponseMessage, ResponseError } from '@common'
import { logger, logError } from '@core/logger'

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
    const parsed = parseInt(err.code.toString().substring(0, 3), 10)
    const status = parsed >= 100 && parsed <= 599 ? parsed : 500
    return res.status(status).send({
      data: null,
      code: err.code,
      message: err.message,
    })
  }

  // Handle unexpected errors with enhanced logging
  if (err instanceof Error) {
    logError(err, {
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id'],
      userId: (req as Request & { user?: { id: string } }).user?.id,
    })
  } else {
    logger.error('Unhandled non-error object', {
      error: String(err),
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    })
  }

  return res.status(500).send({
    data: null,
    code: ResponseCode.SERVER_ERROR,
    message: ResponseMessage.SERVER_ERROR,
  })
}
