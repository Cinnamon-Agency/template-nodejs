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
import prisma from '@core/prismaClient'
import { autoInjectable, singleton } from 'tsyringe'
import { hashString } from '@services/bcrypt'

@singleton()
@autoInjectable()
export class UserService implements IUserService {
  @serviceErrorHandler()
  async createUser({ email, password, authType }: ICreateUser) {
    let hashedPassword = null

    if (password) {
      hashedPassword = await hashString(password)
    }

    const created = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        authType,
      },
    })

    if (!created) {
      return { code: ResponseCode.FAILED_INSERT }
    }

    return { user: created, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getUserById({ userId }: IGetUserById) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }
    return { user, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getUserByEmail({ email }: IGetUserByEmail) {
    const user = await prisma.user.findUnique({ where: { email } })
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
    const user = await prisma.user.findUnique({ where: { email, authType } })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }
    return { user, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async toggleNotifications({ userId }: IToggleNotifications) {
    let code: ResponseCode = ResponseCode.OK
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { notifications: !user.notifications },
    })
    return { code: ResponseCode.OK, user: updatedUser }
  }

  @serviceErrorHandler()
  async updatePassword({ userId, password }: IUpdatePassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }
    const hashedPassword = await hashString(password)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })
    return { code: ResponseCode.OK }
  }
}
