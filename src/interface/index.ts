import { QueryRunner } from 'typeorm'
import { StatusCode, ResponseCode, ResponseMessage } from './response'
import { User } from '../api/user/userModel'

type ResponseCodeRequired = { code: ResponseCode }

type DataType<T> = { [name: string]: T | ResponseCode | undefined }

export type AsyncResponse<T> = Promise<DataType<T> & ResponseCodeRequired>

export interface IServiceMethod {
  queryRunner?: QueryRunner
}

export type ResponseParams = {
  data?: object
  code: ResponseCode
  message?: ResponseMessage
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user: User
    }
  }
}

export { StatusCode, ResponseCode, ResponseMessage }
