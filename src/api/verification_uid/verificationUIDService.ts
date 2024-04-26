import { ResponseCode } from '../../interfaces'
import { logger } from '../../logger'
import { compare, hashString } from '../../services/bcrypt'
import { query } from '../../services/mysql2'
import { getResponseMessage } from '../../services/utils'
import { generateUUID } from '../../services/uuid'
import {
  IClearVerificationUID,
  ISetVerificationUID,
  IVerificationUIDService,
  IVerifyUID
} from './interface'
import { VerificationUIDQueries } from './verificationUIDQueries'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class VerificationUIDService implements IVerificationUIDService {
  async setVerificationUID({ userId, type }: ISetVerificationUID) {
    let code = ResponseCode.OK

    try {
      const uid = generateUUID()
      const hash = await hashString(uid)

      await this.clearVerificationUID({ userId, type })
      await query(VerificationUIDQueries.createVerificationUID, [
        userId,
        hash,
        type
      ])

      return { uid, code }
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

  async clearVerificationUID({ userId, type }: IClearVerificationUID) {
    let code = ResponseCode.OK

    try {
      await query(VerificationUIDQueries.deleteVerificationUID, [userId, type])

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

  async verifyUID({ userId, uid, type }: IVerifyUID) {
    let code = ResponseCode.OK

    try {
      if (
        !uid ||
        typeof uid !== 'string' ||
        !uid.match(
          /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
        )
      ) {
        return { code: ResponseCode.INVALID_UID }
      }

      const [hashedUID] = await query<[any]>(
        VerificationUIDQueries.getVerificationUID,
        [userId, type]
      )

      const matches = await compare(uid, hashedUID)
      if (!matches) {
        return { code: ResponseCode.INVALID_UID }
      }

      return { valid: true, code }
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
