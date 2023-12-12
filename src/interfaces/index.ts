import { StatusCode, ResponseCode, ResponseMessage } from './response'
import { User } from '../api/user/user.interface'

type ResponseCodeRequired = { code: ResponseCode }

type DataType<T> = { [name: string]: T | ResponseCode | undefined }

export type AsyncResponse<T> = Promise<DataType<T> & ResponseCodeRequired>

export type ResponseParams = {data?: object, code: ResponseCode, message?: ResponseMessage}


declare module 'ws' {
  interface WebSocket {
    userId: number
    expiration: string
    isAlive: boolean
  }
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
