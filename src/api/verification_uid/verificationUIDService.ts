import { Repository } from 'typeorm'
import { ResponseCode } from '../../interface'
import { logger } from '../../logger'
import { compare, hashString } from '../../services/bcrypt'
import { getResponseMessage } from '../../services/utils'
import { generateUUID } from '../../services/uuid'
import {
  IClearVerificationUID,
  IGetVerificationUID,
  ISetVerificationUID,
  IVerificationUIDService,
  IVerifyUID
} from './interface'
import { VerificationUID } from './verificationUIDModel'
import { AppDataSource } from '../../services/typeorm'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class VerificationUIDService implements IVerificationUIDService {
  private readonly verificationUIDRepository: Repository<VerificationUID>

  constructor() {
    this.verificationUIDRepository =
      AppDataSource.manager.getRepository(VerificationUID)
  }

  setVerificationUID = async ({
    userId,
    type,
    queryRunner
  }: ISetVerificationUID) => {
    let code = ResponseCode.OK

    try {
      const uid = generateUUID()
      const hashUID = generateUUID()
      const hash = await hashString(hashUID)

      await this.clearVerificationUID({ userId, type })

      const insertResult = await this.verificationUIDRepository
        .createQueryBuilder('verificationUID', queryRunner)
        .insert()
        .into(VerificationUID)
        .values([{ userId, uid, hash, type }])
        .execute()

      if (insertResult.raw.affectedRows !== 1) {
        return { code: ResponseCode.FAILED_INSERT }
      }

      return { uids: { uid, hashUID }, code }
    } catch (err: any) {
      switch (err.errno) {
        case 1062:
          code = ResponseCode.DUPLICATE_REGISTRATION_UID
          break
        case 1452:
          code = ResponseCode.USER_NOT_FOUND
          break
        default:
          code = ResponseCode.SERVER_ERROR
      }
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  getVerificationUID = async ({ uid }: IGetVerificationUID) => {
    let code = ResponseCode.OK

    try {
      const verificationUID = await this.verificationUIDRepository.findOne({
        where: { uid }
      })
      if (!verificationUID) {
        return { code: ResponseCode.INVALID_UID }
      }

      return { verificationUID, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  clearVerificationUID = async ({ userId, type }: IClearVerificationUID) => {
    let code = ResponseCode.OK

    try {
      const verificationUID = await this.verificationUIDRepository.findOne({
        where: { userId, type }
      })
      if (!verificationUID) {
        return { code: ResponseCode.VERIFICATION_UID_NOT_FOUND }
      }

      await this.verificationUIDRepository.delete({
        id: verificationUID.id
      })

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  verifyUID = async ({ uid, hashUid, type }: IVerifyUID) => {
    let code = ResponseCode.OK

    try {
      const verificationUID = await this.verificationUIDRepository.findOne({
        where: { uid, type }
      })
      if (!verificationUID) {
        return { code: ResponseCode.VERIFICATION_UID_NOT_FOUND }
      }

      const matches = await compare(hashUid, verificationUID.hash)
      if (!matches) {
        return { code: ResponseCode.INVALID_UID }
      }

      return { verificationUID, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }
}
