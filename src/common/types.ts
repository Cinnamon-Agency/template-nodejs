import { ResponseCode, ResponseMessage } from './response'
import { Prisma } from '@prisma/client'

export type AuthenticatedUser = Omit<
  Prisma.UserGetPayload<{
    include: { roles: { include: { role: true } } }
  }>,
  'password'
>

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
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user: AuthenticatedUser
      requestId: string
    }
  }
}
