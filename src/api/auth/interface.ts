import { AsyncResponse } from '@common'
import { User, AuthType } from '@prisma/client'

interface TokenResponse {
  accessToken: string
  accessTokenExpiresAt: Date
  refreshToken: string
  refreshTokenExpiresAt: Date
}

export interface ISignToken {
  user: User
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

export interface ILogin {
  authType: AuthType
  email: string
  password?: string
}

export interface IAuthenticatePassword {
  user: User
  password: string
}

export interface IVerifyEmail {
  uid: string
  hashUid: string
}

export interface IResendVerificationEmail {
  email: string
}

export interface ISendVerificationCode {
  phoneNumber: string
  userId: string
}

export interface IVerifyPhoneCode {
  userId: string
  code: string
}

export interface IStoreDeviceToken {
  deviceToken: string
  userId: string
  expiresInDays?: number
}

export interface IResendLoginCode {
  email: string
}

export interface ISetNewPassword {
  uid: string
  hashUid: string
  password: string
}

export interface IVerifyLoginCode {
  loginCode: string
  email: string
  dontAskOnThisDevice?: boolean
  deviceToken?: string
}

export interface IVerifyLoginCodeResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: Date
    refreshTokenExpiresAt: Date
  }
}

export interface IAuthService {
  login(params: ILogin): AsyncResponse<User>
  register(params: ILogin): AsyncResponse<User>
  signToken(params: ISignToken): AsyncResponse<TokenResponse>
  refreshToken(params: IRefreshToken): AsyncResponse<TokenResponse>
  logout(params: ILogout): AsyncResponse<boolean>
  sendForgotPasswordEmail(params: ISendForgotPasswordEmail): AsyncResponse<void>
  authenticatePassword(params: IAuthenticatePassword): AsyncResponse<boolean>
  resetPassword(params: IResetPassword): AsyncResponse<void>
  verifyEmail(params: IVerifyEmail): AsyncResponse<void>
  resendVerificationEmail(params: IResendVerificationEmail): AsyncResponse<void>
  sendPhoneVerificationCode(params: ISendVerificationCode): AsyncResponse<void>
  verifyPhoneCode(params: IVerifyPhoneCode): AsyncResponse<void>
  storeDeviceToken(params: IStoreDeviceToken): AsyncResponse<void>
  resendLoginCode(params: IResendLoginCode): AsyncResponse<void>
  setNewPassword(params: ISetNewPassword): AsyncResponse<{ userId: string }>
  verifyLoginCode(
    params: IVerifyLoginCode
  ): AsyncResponse<IVerifyLoginCodeResponse>
}
