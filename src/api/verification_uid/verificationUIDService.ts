import { prisma } from '@app'
import { ResponseCode, serviceMethod } from '@common'
import { compare, hashString } from '@services/bcrypt'
import { generateUUID } from '@services/uuid'
import {
  IClearVerificationUID,
  IGetVerificationUID,
  ISetVerificationUID,
  IVerificationUIDService,
  IVerifyUID,
} from './interface'
import { autoInjectable, singleton } from 'tsyringe'
import { VerificationUID, VerificationUIDType } from '@prisma/client'

@singleton()
@autoInjectable()
export class VerificationUIDService implements IVerificationUIDService {
  @serviceMethod({
    onError: async (err: unknown) => {
      return { code: ResponseCode.SERVER_ERROR }
    },
  })
  async setVerificationUID({ userId, type }: ISetVerificationUID) {
    const uid = generateUUID()
    const hashUID = generateUUID()
    const hash = await hashString(hashUID)

    await this.clearVerificationUID({ userId, type })

    const created = await prisma.verificationUID.create({
      data: { userId, uid, hash, type },
    })

    if (!created) {
      return { code: ResponseCode.FAILED_INSERT }
    }

    return { uids: { uid, hashUID }, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getVerificationUID({ uid }: IGetVerificationUID) {
    const verificationUID = await prisma.verificationUID.findFirst({
      where: { uid },
    })
    if (!verificationUID) {
      return { code: ResponseCode.INVALID_UID }
    }

    return { verificationUID, code: ResponseCode.OK }
  }

  @serviceMethod()
  async clearVerificationUID({ userId, type }: IClearVerificationUID) {
    const verificationUID = await prisma.verificationUID.findFirst({
      where: {
        userId,
        type: type,
      },
    })
    if (!verificationUID) {
      return { code: ResponseCode.VERIFICATION_UID_NOT_FOUND }
    }

    await prisma.verificationUID.delete({
      where: { id: verificationUID.id },
    })

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async verifyUID({ uid, hashUid, type }: IVerifyUID) {
    const verificationUID = await prisma.verificationUID.findFirst({
      where: {
        uid,
        type: type,
      },
    })
    if (!verificationUID) {
      return { code: ResponseCode.VERIFICATION_UID_NOT_FOUND }
    }

    const matches = await compare(hashUid, verificationUID.hash)
    if (!matches) {
      return { code: ResponseCode.INVALID_UID }
    }

    return { verificationUID, code: ResponseCode.OK }
  }
}
