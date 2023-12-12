import { NextFunction, Request, Response } from 'express'
import { ResponseCode, ResponseMessage } from '../../interfaces'

export const notFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res.status(404).send({
    data: null,
    code: ResponseCode.NOT_FOUND,
    message: ResponseMessage.NOT_FOUND
  })
}
