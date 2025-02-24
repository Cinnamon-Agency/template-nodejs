import { QueryRunner } from 'typeorm'
import { User } from '@api/user/userModel'
import { ResponseCode, ResponseMessage } from './response'
import fileUpload from 'express-fileupload'

// Response related types
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

// Service related types
export interface ITransactionMethod {
  queryRunner?: QueryRunner
}

// Express type extensions
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user: User
      files?: fileUpload.FileArray | null | undefined
      responseCode: ResponseCode
    }
  }
}
