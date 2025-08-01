import { AsyncResponse } from '@common'
import { VerificationUID } from 'generated/prisma'

export enum VerificationUIDType {
  REGISTRATION = 'Registration',
  RESET_PASSWORD = 'ResetPassword',
  CHANGE_EMAIL = 'ChangeEmail',
}

export interface ISetVerificationUID {
  userId: string
  type: VerificationUIDType
}

export interface IGetVerificationUID {
  uid: string
}

export interface IClearVerificationUID {
  userId: string
  type: VerificationUIDType
}

export interface IVerifyUID {
  uid: string
  hashUid: string
  type: VerificationUIDType
}

export interface IVerificationUIDService {
  setVerificationUID(
    params: ISetVerificationUID
  ): AsyncResponse<{ uid: string; hashUID: string }>
  getVerificationUID(
    params: IGetVerificationUID
  ): AsyncResponse<VerificationUID>
  clearVerificationUID(params: IClearVerificationUID): AsyncResponse<null>
  verifyUID(params: IVerifyUID): AsyncResponse<VerificationUID>
}
