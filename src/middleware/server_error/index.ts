import { Request, Response } from 'express'
import { ResponseMessage, ResponseCode } from '@common'

// 500 returned instead of 404 to avoid leaking information
export const serverErrorNotFound = async (req: Request, res: Response) => {
  return res.status(500).send({
    code: ResponseCode.SERVER_ERROR,
    message: ResponseMessage.SERVER_ERROR,
  })
}
