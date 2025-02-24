import { ResponseCode, serviceErrorHandler } from '@common'
import {
  IUserService,
  ICreateUser,
  IGetUserById,
  IGetUserByEmail,
  IToggleNotifications,
  IUpdatePassword,
  IGetUserByEmailAndAuthType,
} from './interface'
import { User } from './userModel'
import { DataSource, Repository } from 'typeorm'
import { autoInjectable, inject, singleton } from 'tsyringe'
import { hashString } from '@services/bcrypt'

@singleton()
@autoInjectable()
export class UserService implements IUserService {
  private readonly userRepository: Repository<User>

  constructor(@inject(DataSource) private readonly dataSource: DataSource) {
    this.userRepository = this.dataSource.manager.getRepository(User)
  }

  @serviceErrorHandler()
  async createUser({ email, password, authType, queryRunner }: ICreateUser) {
    let hashedPassword = null

    if (password) {
      hashedPassword = await hashString(password)
    }

    const insertResult = await this.userRepository
      .createQueryBuilder('user', queryRunner)
      .insert()
      .into(User)
      .values([{ email, password: hashedPassword, authType }])
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

    return { user, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getUserById({ userId, queryRunner }: IGetUserById) {
    const query = this.userRepository
      .createQueryBuilder('user', queryRunner)
      .where('user.id = :userId', { userId })

    const user = await query.getOne()

    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    return { user, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getUserByEmail({ email, queryRunner }: IGetUserByEmail) {
    const user = await this.userRepository
      .createQueryBuilder('user', queryRunner)
      .where('user.email = :email', { email })
      .getOne()
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    return { user, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getUserByEmailAndAuthType({
    authType,
    email,
  }: IGetUserByEmailAndAuthType) {
    const user = await this.userRepository.findOne({
      where: {
        email,
        authType,
      },
    })

    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    return { user, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async toggleNotifications({ userId }: IToggleNotifications) {
    let code: ResponseCode = ResponseCode.OK

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
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
  }

  @serviceErrorHandler()
  async updatePassword({ userId, password }: IUpdatePassword) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    })

    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    await this.userRepository.update(userId, {
      password,
    })

    return { code: ResponseCode.OK }
  }
}
