import { ResponseCode, ResponseMessage } from './response'
import fileUpload from 'express-fileupload'
import { User } from '@prisma/client'

export type ResponseCodeRequired = { code: ResponseCode }

export type AsyncResponse<T> =
  | Promise<T & ResponseCodeRequired>
  | Promise<ResponseCodeRequired>

export type SyncResponse<T> = (T & ResponseCodeRequired) | ResponseCodeRequired

export type ResponseParams = {
  data?: object
  code: ResponseCode
  message?: ResponseMessage
}

declare global {
  namespace Express {
    export interface Request {
      user: User
      files?: fileUpload.FileArray | null | undefined
      responseCode: ResponseCode
    }
  }
}
