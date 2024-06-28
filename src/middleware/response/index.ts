import { NextFunction, Request, Response } from 'express'
import { ResponseParams, ResponseCode } from '../../interface'
import { getResponseMessage } from '../../services/utils'

/* Response formatting

 Each response includes 3 required fields.
 data - Optional
 code - Mandatory code, a ResponseCode code, which consists of 5 numbers. The first 3 being the status code of the response, and the last 2 being a code identifier
 message - Mandatory message, a ResponseMessage message which can match the response code, or custom defined by the user
*/
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
