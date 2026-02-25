import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  return next({
    code: ResponseCode.NOT_FOUND,
  })
}
