import { ResponseCode, serviceErrorHandler } from '@common'
import { DataSource, Repository } from 'typeorm'
import {
  IExpireUserSession,
  IGetUserSession,
  IStoreUserSession,
  IUpdateUserSession,
  IUserSessionService,
  UserSessionStatus,
} from './interface'
import { UserSession } from './userSessionModel'
import { UserService } from '@api/user/userService'
import config from '@core/config'
import { compare, hashString } from '@services/bcrypt'
import { autoInjectable, inject, singleton } from 'tsyringe'

@singleton()
@autoInjectable()
export class UserSessionService implements IUserSessionService {
  private readonly userSessionRepository: Repository<UserSession>

  constructor(
    @inject(DataSource) private readonly dataSource: DataSource,
    private readonly userService: UserService
  ) {
    this.userSessionRepository =
      this.dataSource.manager.getRepository(UserSession)
  }

  @serviceErrorHandler()
  async storeUserSession({ userId, refreshToken }: IStoreUserSession) {
    const { user, code: userCode } = await this.userService.getUserById({
      userId,
    })
    if (!user) {
      return { code: userCode }
    }

    const existingSession = await this.userSessionRepository.findOne({
      where: { userId, status: UserSessionStatus.ACTIVE },
    })
    if (existingSession) {
      existingSession.status = UserSessionStatus.LOGGED_OUT
      await this.userSessionRepository.save(existingSession)
    }

    const expiresAt = new Date(
      Date.now() + Number(config.REFRESH_TOKEN_EXPIRES_IN) * 60 * 1000
    )

    const refreshTokenHash = await hashString(refreshToken)
    const userSession = new UserSession(userId, refreshTokenHash, expiresAt)
    await this.userSessionRepository.save(userSession)

    return { userSession, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getUserSession({ userId }: IGetUserSession) {
    const { user, code: userCode } = await this.userService.getUserById({
      userId,
    })
    if (!user) {
      return { code: userCode }
    }

    const userSession = await this.userSessionRepository.findOne({
      where: { userId },
    })

    if (!userSession) {
      return { code: ResponseCode.USER_SESSION_NOT_FOUND }
    }

    return { userSession, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async updateUserSession({ userId, refreshToken }: IUpdateUserSession) {
    const { user } = await this.userService.getUserById({
      userId,
    })
    if (!user) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const userSession = await this.userSessionRepository.findOne({
      where: { userId, status: UserSessionStatus.ACTIVE },
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
    await this.userSessionRepository.save(userSession)

    return { userSession, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async expireUserSession({ userId, status }: IExpireUserSession) {
    const { user, code: userCode } = await this.userService.getUserById({
      userId,
    })
    if (!user) {
      return { code: userCode }
    }

    const userSession = await this.userSessionRepository.findOne({
      where: { userId, status: UserSessionStatus.ACTIVE },
    })
    if (!userSession) {
      return { code: ResponseCode.USER_SESSION_NOT_FOUND }
    }

    userSession.status = status
    await this.userSessionRepository.save(userSession)

    return { code: ResponseCode.OK }
  }
}
