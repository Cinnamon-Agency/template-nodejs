import { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'

const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Assigns a unique request ID to every incoming request.
 * If the client already provides an `x-request-id` header, it is reused.
 * The ID is attached to `req.requestId` and echoed back in the response header.
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id =
    (req.headers[REQUEST_ID_HEADER] as string | undefined) || randomUUID()

  req.requestId = id
  res.setHeader(REQUEST_ID_HEADER, id)

  next()
}
