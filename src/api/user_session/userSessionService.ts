import { ResponseCode, serviceMethod, MINUTES_TO_MS } from '@common'
import {
  IExpireUserSession,
  IGetUserSession,
  IStoreUserSession,
  IUpdateUserSession,
  IUserSessionService,
  UserSessionStatus as InterfaceSessionStatus,
} from './interface'
import config from '@core/config'
import { compare, hashString } from '@services/bcrypt'
import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import { UserSessionStatus } from '@prisma/client'

@singleton()
@autoInjectable()
export class UserSessionService implements IUserSessionService {
  @serviceMethod()
  async storeUserSession({ userId, refreshToken }: IStoreUserSession) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const existingSession = await getPrismaClient().userSession.findFirst({
      where: {
        userId,
        status: UserSessionStatus.ACTIVE,
      },
    })
    if (existingSession) {
      await getPrismaClient().userSession.update({
        where: { id: existingSession.id },
        data: { status: UserSessionStatus.LOGGED_OUT },
      })
    }

    const expiresAt = new Date(
      Date.now() + Number(config.REFRESH_TOKEN_EXPIRES_IN) * MINUTES_TO_MS
    )

    const refreshTokenHash = await hashString(refreshToken)
    const userSession = await getPrismaClient().userSession.create({
      data: { userId, refreshToken: refreshTokenHash, expiresAt },
    })

    return { userSession, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getUserSession({ userId }: IGetUserSession) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const userSession = await getPrismaClient().userSession.findFirst({
      where: { userId },
    })

    if (!userSession) {
      return { code: ResponseCode.USER_SESSION_NOT_FOUND }
    }

    return { userSession, code: ResponseCode.OK }
  }

  @serviceMethod()
  async updateUserSession({
    userId,
    oldRefreshToken,
    newRefreshToken,
  }: IUpdateUserSession) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const userSession = await getPrismaClient().userSession.findFirst({
      where: {
        userId,
        status: UserSessionStatus.ACTIVE,
      },
    })
    if (!userSession) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const matches = await compare(oldRefreshToken, userSession.refreshToken)
    if (!matches) {
      return { code: ResponseCode.INVALID_TOKEN }
    }

    const refreshTokenHash = await hashString(newRefreshToken)

    const expiresAt = new Date(
      Date.now() + Number(config.REFRESH_TOKEN_EXPIRES_IN) * MINUTES_TO_MS
    )

    await getPrismaClient().userSession.update({
      where: { id: userSession.id },
      data: {
        refreshToken: refreshTokenHash,
        expiresAt,
      },
    })

    return { userSession: { ...userSession, expiresAt }, code: ResponseCode.OK }
  }

  @serviceMethod()
  async expireUserSession({ userId, status }: IExpireUserSession) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    const userSession = await getPrismaClient().userSession.findFirst({
      where: {
        userId,
        status: UserSessionStatus.ACTIVE,
      },
    })
    if (!userSession) {
      return { code: ResponseCode.USER_SESSION_NOT_FOUND }
    }

    await getPrismaClient().userSession.update({
      where: { id: userSession.id },
      data: { status: status === InterfaceSessionStatus.LOGGED_OUT ? UserSessionStatus.LOGGED_OUT : UserSessionStatus.EXPIRED },
    })

    return { code: ResponseCode.OK }
  }
}
