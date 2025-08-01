import { AsyncResponse } from '@common'
import { UserSession } from 'generated/prisma'

export enum UserSessionStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  LOGGED_OUT = 'LoggedOut',
}

export interface IStoreUserSession {
  userId: string
  refreshToken: string
}

export interface IUpdateUserSession {
  userId: string
  refreshToken: string
}

export interface IExpireUserSession {
  userId: string
  status: UserSessionStatus.EXPIRED | UserSessionStatus.LOGGED_OUT
}

export interface IGetUserSession {
  userId: string
}

export interface IUserSessionService {
  getUserSession(params: IGetUserSession): AsyncResponse<UserSession>
  storeUserSession(params: IStoreUserSession): AsyncResponse<UserSession>
  updateUserSession(params: IUpdateUserSession): AsyncResponse<UserSession>
  expireUserSession(params: IExpireUserSession): AsyncResponse<null>
}
