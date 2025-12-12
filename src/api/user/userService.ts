import { ResponseCode, serviceMethod } from '@common'
import {
  IUserService,
  ICreateUser,
  IGetUserById,
  IGetUserByEmail,
  IToggleNotifications,
  IUpdatePassword,
  IGetUserByEmailAndAuthType,
  IUpdateUser,
} from './interface'
import { prisma } from '@app'
import { User } from '@prisma/client'
import { autoInjectable, singleton } from 'tsyringe'
import { hashString } from '@services/bcrypt'

@singleton()
@autoInjectable()
export class UserService implements IUserService {
  @serviceMethod()
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

    return { user: created, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getUserById({ userId }: IGetUserById) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }
    return { user, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getUserByEmail({ email }: IGetUserByEmail) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }
    return { user, code: ResponseCode.OK }
  }

  @serviceMethod()
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

  @serviceMethod()
  async toggleNotifications({ userId }: IToggleNotifications) {
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

  @serviceMethod()
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

  @serviceMethod()
  async updateUser({
    userId,
    emailVerified,
    phoneNumber,
    phoneVerified,
  }: IUpdateUser) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const updateData: Partial<
      Pick<User, 'emailVerified' | 'phoneNumber' | 'phoneVerified'>
    > = {}
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (phoneVerified !== undefined) updateData.phoneVerified = phoneVerified

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
    return { code: ResponseCode.OK }
  }
}
