import { ResponseCode } from '../../interfaces'
import { AppDataSource } from '../../services/typeorm'
import { Repository } from 'typeorm'
import { logger } from '../../logger'
import { getResponseMessage } from '../../services/utils'
import {
  IExpireUserSession,
  IStoreUserSession,
  IUpdateUserSession,
  IUserSessionService,
  UserSessionStatus
} from './interface'
import { UserSession } from './userSessionModel'
import { UserService } from '../user/userService'
import config from '../../config'
import { compare, hashString } from '../../services/bcrypt'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class UserSessionService implements IUserSessionService {
  private readonly userSessionRepository: Repository<UserSession>
  private readonly userService: UserService

  constructor(userService: UserService) {
    this.userSessionRepository =
      AppDataSource.manager.getRepository(UserSession)
    this.userService = userService
  }

  storeUserSession = async ({ userId, refreshToken }: IStoreUserSession) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user, code: userCode } = await this.userService.getUserById({
        userId
      })
      if (!user) {
        return { code: userCode }
      }

      const existingSession = await this.userSessionRepository.findOne({
        where: { userId, status: UserSessionStatus.ACTIVE }
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

      return { userSession, code }
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

  updateUserSession = async ({ userId, refreshToken }: IUpdateUserSession) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user } = await this.userService.getUserById({
        userId
      })
      if (!user) {
        return { code: ResponseCode.SESSION_EXPIRED }
      }

      const userSession = await this.userSessionRepository.findOne({
        where: { userId, status: UserSessionStatus.ACTIVE }
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

      return { userSession, code }
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

  expireUserSession = async ({ userId, status }: IExpireUserSession) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user, code: userCode } = await this.userService.getUserById({
        userId
      })
      if (!user) {
        return { code: userCode }
      }

      const userSession = await this.userSessionRepository.findOne({
        where: { userId, status: UserSessionStatus.ACTIVE }
      })
      if (!userSession) {
        return { code: ResponseCode.USER_SESSION_NOT_FOUND }
      }

      userSession.status = status
      await this.userSessionRepository.save(userSession)

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
}
