import { DataSource, Repository } from 'typeorm'
import {
  isMySQLError,
  MySQLError,
  ResponseCode,
  serviceErrorHandler,
} from '@common'
import { compare, hashString } from '@services/bcrypt'
import { generateUUID } from '@services/uuid'
import {
  IClearVerificationUID,
  IGetVerificationUID,
  ISetVerificationUID,
  IVerificationUIDService,
  IVerifyUID,
} from './interface'
import { VerificationUID } from './verificationUIDModel'
import { autoInjectable, inject, singleton } from 'tsyringe'

@singleton()
@autoInjectable()
export class VerificationUIDService implements IVerificationUIDService {
  private readonly verificationUIDRepository: Repository<VerificationUID>

  constructor(@inject(DataSource) private readonly dataSource: DataSource) {
    this.verificationUIDRepository =
      this.dataSource.manager.getRepository(VerificationUID)
  }

  @serviceErrorHandler({
    onError: async (err: unknown) => {
      if (isMySQLError(err)) {
        let code = ResponseCode.SERVER_ERROR
        const error = err as MySQLError
        switch (error.errno) {
          case 1062:
            code = ResponseCode.DUPLICATE_REGISTRATION_UID
            break
          case 1452:
            code = ResponseCode.USER_NOT_FOUND
            break
        }
        return { code }
      }
    },
  })
  async setVerificationUID({ userId, type, queryRunner }: ISetVerificationUID) {
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

    return { uids: { uid, hashUID }, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getVerificationUID({ uid }: IGetVerificationUID) {
    const verificationUID = await this.verificationUIDRepository.findOne({
      where: { uid },
    })
    if (!verificationUID) {
      return { code: ResponseCode.INVALID_UID }
    }

    return { verificationUID, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async clearVerificationUID({ userId, type }: IClearVerificationUID) {
    const verificationUID = await this.verificationUIDRepository.findOne({
      where: { userId, type },
    })
    if (!verificationUID) {
      return { code: ResponseCode.VERIFICATION_UID_NOT_FOUND }
    }

    await this.verificationUIDRepository.delete({
      id: verificationUID.id,
    })

    return { code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async verifyUID({ uid, hashUid, type }: IVerifyUID) {
    const verificationUID = await this.verificationUIDRepository.findOne({
      where: { uid, type },
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
