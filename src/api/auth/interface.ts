import { AsyncResponse } from '../../interfaces'
import { User } from '../user/userModel'


export interface IVerifyUser {
  uid: string
  hashUid: string
  password: string
}

export interface ICheckCredentials {
  email: string
  password: string
}

export interface ISignToken {
  user: User
}

interface TokenResponse {
  accessToken: string
  accessTokenExpiresAt: Date
  refreshToken: string
  refreshTokenExpiresAt: Date
}

export interface IRefreshToken {
  refreshToken: string
}

export interface ILogout {
  userId: string
}

export interface ISendForgotPasswordEmail {
  email: string
}

export interface IResetPassword {
  uid: string
  hashUid: string
  password: string
}

export interface IAuthService {
  verifyUser(params: IVerifyUser): AsyncResponse<User>
  authenticatePassword(params: ICheckCredentials): AsyncResponse<User>
  signToken(params: ISignToken): AsyncResponse<TokenResponse>
  refreshToken(params: IRefreshToken): AsyncResponse<TokenResponse>
  logout(params: ILogout): AsyncResponse<boolean>
  sendForgotPasswordEmail(params: ISendForgotPasswordEmail): AsyncResponse<null>
  resetPassword(params: IResetPassword): AsyncResponse<null>
}
