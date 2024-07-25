import { Request, Response } from 'express'
import { ResponseCode, ResponseMessage } from '../../interface'

export const notFound = async (req: Request, res: Response) => {
  return res.status(404).send({
    data: null,
    code: ResponseCode.NOT_FOUND,
    message: ResponseMessage.NOT_FOUND
  })
}
