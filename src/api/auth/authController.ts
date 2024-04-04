import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '../../interfaces'
import { AuthService } from './authService'
import _ from 'lodash'
import { UserService } from '../user/userService'
import { VerificationUIDService } from '../verification_uid/verificationUIDService'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class AuthController {
  private readonly authService: AuthService
  private readonly userService: UserService
  private readonly verificationUIDService: VerificationUIDService

  constructor(
    authService: AuthService,
    userService: UserService,
    verificationUIDService: VerificationUIDService
  ) {
    this.authService = authService
    this.userService = userService
    this.verificationUIDService = verificationUIDService
  }

  verifyUser = async (req: Request, res: Response, next: NextFunction) => {
    const { uid, password } = res.locals.input

    let uids = uid.split('/')
    if (uids.length > 2) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { user, code } = await this.authService.verifyUser({
      uid: uids[0],
      hashUid: uids[1],
      password
    })
    if (!user) {
      return next({ code })
    }

    let responseUser: any = _.omit(user, [
      'id',
      'status',
      'password',
      'createdAt',
      'updatedAt'
    ])

    responseUser.userId = user.id

    const { tokens, code: tokenCode } = await this.authService.signToken({
      user
    })
    if (!tokens) {
      return next({ code: tokenCode })
    }

    return next({
      data: {
        user: {
          ...responseUser
        },
        ...tokens
      },
      code: ResponseCode.OK
    })
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = res.locals.input

    const { user, code } = await this.authService.authenticatePassword({
      email,
      password
    })
    if (!user) {
      return next({ code })
    }

    let responseUser: any = _.omit(user, [
      'id',
      'status',
      'password',
      'createdAt',
      'updatedAt'
    ])

    responseUser.userId = user.id

    const { tokens, code: tokenCode } = await this.authService.signToken({
      user
    })
    if (!tokens) {
      return next({ code: tokenCode })
    }

    return next({
      data: {
        user: {
          ...responseUser
        },
        ...tokens
      },
      code: ResponseCode.OK
    })
  }

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.headers['refresh-token'] as string

    const { tokens, code } = await this.authService.refreshToken({
      refreshToken
    })
    if (!tokens) {
      return next({ code })
    }

    return next({
      data: tokens,
      code: ResponseCode.OK
    })
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req

    const { code } = await this.authService.logout({ userId: user.id })

    return next({ code })
  }

  getEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { uid } = res.locals.input

    const verificationResult =
      await this.verificationUIDService.getVerificationUID({
        uid
      })
    if (!verificationResult.verificationUID) {
      return next({ code: verificationResult.code })
    }

    let { user, code } = await this.userService.getUserById({
      userId: verificationResult.verificationUID.userId,
      allUsers: true
    })
    if (!user) {
      return next({ code })
    }

    return next({ data: user.email, code })
  }

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = res.locals.input

    const { code } = await this.authService.sendForgotPasswordEmail({ email })

    return next({ code })
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { uid, password } = res.locals.input

    let uids = uid.split('/')
    if (uids.length > 2) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { code } = await this.authService.resetPassword({
      uid: uids[0],
      hashUid: uids[1],
      password
    })

    return next({ code })
  }
}
