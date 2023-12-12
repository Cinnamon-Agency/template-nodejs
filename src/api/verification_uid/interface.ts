import { AsyncResponse } from '../../interfaces'

export enum VerificationUIDType {
  REGISTRATION = 'Registration',
  RESET_PASSWORD = 'ResetPassword'
}

export type VerificationUID = {
  id: number
  userId: number
  UID: string
  type: VerificationUIDType
  createdAt: string
  updatedAt: string
}

export interface ISetVerificationUID {
  userId: number
  type: VerificationUIDType
}

export interface IClearVerificationUID {
  userId: number
  type: VerificationUIDType
}

export interface IVerifyUID {
  userId: number
  uid: string
  type: VerificationUIDType
}

export interface IVerificationUIDService {
  setVerificationUID(params: ISetVerificationUID): AsyncResponse<string>
  clearVerificationUID(params: IClearVerificationUID): AsyncResponse<string>
  verifyUID(params: IVerifyUID): AsyncResponse<boolean>
}
