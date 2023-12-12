import { NextFunction, Request, Response } from 'express'
import { ResponseParams, ResponseCode } from '../../interfaces'
import { getResponseMessage } from '../../services/utils'

export const responseFormatter = async (
  prev: ResponseParams,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data, code, message: definedMessage } = prev

  const status = code ? parseFloat(code.toString().substring(0, 3)) : 500

  let message = definedMessage || null
  if (!message) {
    message = getResponseMessage(code)
  }

  res.status(status).send({
    data: data || null,
    code: code || ResponseCode.SERVER_ERROR,
    message
  })
}
