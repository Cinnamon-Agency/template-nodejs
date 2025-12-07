import { ResponseCode, serviceMethod } from '@common'
import {
  IExpireUserSession,
  IGetUserSession,
  IStoreUserSession,
  IUpdateUserSession,
  IUserSessionService,
} from './interface'
import config from '@core/config'
import { compare, hashString } from '@services/bcrypt'
import { autoInjectable, singleton } from 'tsyringe'
import { prisma } from '@app'
import { UserSessionStatus } from '@prisma/client'

@singleton()
@autoInjectable()
export class UserSessionService implements IUserSessionService {
  @serviceMethod()
  async storeUserSession({ userId, refreshToken }: IStoreUserSession) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const existingSession = await prisma.userSession.findFirst({
      where: {
        userId,
        status: UserSessionStatus.ACTIVE,
      },
    })
    if (existingSession) {
      await prisma.userSession.update({
        where: { id: existingSession.id },
        data: { status: UserSessionStatus.LOGGED_OUT },
      })
    }

    const expiresAt = new Date(
      Date.now() + Number(config.REFRESH_TOKEN_EXPIRES_IN) * 60 * 1000
    )

    const refreshTokenHash = await hashString(refreshToken)
    const userSession = await prisma.userSession.create({
      data: { userId, refreshToken: refreshTokenHash, expiresAt },
    })

    return { userSession, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getUserSession({ userId }: IGetUserSession) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const userSession = await prisma.userSession.findFirst({
      where: { userId },
    })

    if (!userSession) {
      return { code: ResponseCode.USER_SESSION_NOT_FOUND }
    }

    return { userSession, code: ResponseCode.OK }
  }

  @serviceMethod()
  async updateUserSession({ userId, refreshToken }: IUpdateUserSession) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const userSession = await prisma.userSession.findFirst({
      where: {
        userId,
        status: UserSessionStatus.ACTIVE,
      },
    })
    if (!userSession) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const matches = await compare(refreshToken, userSession.refreshToken)
    if (!matches) {
      return { code: ResponseCode.INVALID_TOKEN }
    }

    const refreshTokenHash = await hashString(refreshToken)

    const expiresAt = new Date(
      Date.now() + Number(config.REFRESH_TOKEN_EXPIRES_IN) * 60 * 1000
    )

    userSession.refreshToken = refreshTokenHash
    userSession.expiresAt = expiresAt
    await prisma.userSession.update({
      where: { id: userSession.id },
      data: userSession,
    })

    return { userSession, code: ResponseCode.OK }
  }

  @serviceMethod()
  async expireUserSession({ userId, status }: IExpireUserSession) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const userSession = await prisma.userSession.findFirst({
      where: {
        userId,
        status: UserSessionStatus.ACTIVE,
      },
    })
    if (!userSession) {
      return { code: ResponseCode.USER_SESSION_NOT_FOUND }
    }

    await prisma.userSession.update({
      where: { id: userSession.id },
      data: { status: UserSessionStatus.EXPIRED },
    })

    return { code: ResponseCode.OK }
  }
}
