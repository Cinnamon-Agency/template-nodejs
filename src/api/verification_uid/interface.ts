import { AsyncResponse } from '@common'
import { VerificationUID, VerificationUIDType } from '@prisma/client'

// Re-export the VerificationUIDType from Prisma
export { VerificationUIDType } from '@prisma/client'

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
  clearVerificationUID(params: IClearVerificationUID): AsyncResponse<void>
  verifyUID(params: IVerifyUID): AsyncResponse<VerificationUID>
}
