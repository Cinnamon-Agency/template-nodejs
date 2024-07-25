import { ResponseCode } from '../../interface'
import {
  IUserService,
  ICreateUser,
  IGetUserById,
  IGetUserByEmail,
  IToogleNotifications,
  IUpdatePassword,
  IGetUserByEmailAndAuthType
} from './interface'
import { AppDataSource } from '../../services/typeorm'
import { User } from './userModel'
import { Repository } from 'typeorm'
import { logger } from '../../logger'
import { getResponseMessage } from '../../services/utils'
import { autoInjectable } from 'tsyringe'
import { hashString } from '../../services/bcrypt'
@autoInjectable()
export class UserService implements IUserService {
  private readonly userRepository: Repository<User>

  constructor() {
    this.userRepository = AppDataSource.manager.getRepository(User)
  }

  createUser = async ({
    email,
    password,
    authType,
    queryRunner
  }: ICreateUser) => {
    let code: ResponseCode = ResponseCode.OK

    let hashedPassword = null

    if (password) {
      hashedPassword = await hashString(password)
    }

    try {
      const insertResult = await this.userRepository
        .createQueryBuilder('user', queryRunner)
        .insert()
        .into(User)
        .values([
          { email, password: hashedPassword, authType }
        ])
        .execute()

      if (insertResult.raw.affectedRows !== 1) {
        return { code: ResponseCode.FAILED_INSERT }
      }

      const userId = insertResult.identifiers[0].id

      const user = await this.userRepository
        .createQueryBuilder('user', queryRunner)
        .where('user.id = :userId', { userId })
        .getOne()

      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
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

  getUserById = async ({ userId, queryRunner }: IGetUserById) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const query = this.userRepository
        .createQueryBuilder('user', queryRunner)
        .where('user.id = :userId', { userId })

      const user = await query.getOne()

      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
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

  getUserByEmail = async ({ email, queryRunner }: IGetUserByEmail) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const user = await this.userRepository
        .createQueryBuilder('user', queryRunner)
        .where('user.email = :email', { email })
        .getOne()
      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
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

  getUserByEmailAndAuthType = async ({
    authType,
    email
  }: IGetUserByEmailAndAuthType) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const user = await this.userRepository.findOne({
        where: {
          email,
          authType
        }
      })

      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
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

  toogleNotifications = async ({ userId }: IToogleNotifications) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId
        }
      })

      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      user.notifications = !user.notifications

      const updatedUser = await this.userRepository.save(user)

      if (!updatedUser) {
        code = ResponseCode.FAILED_INSERT
      }

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

  async updatePassword({ userId, password }: IUpdatePassword) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId
        }
      })

      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      await this.userRepository.update(userId, {
        password
      })

      return { code }
    } catch (e: unknown) {
      code = ResponseCode.SERVER_ERROR
    }
    return { code }
  }
}
