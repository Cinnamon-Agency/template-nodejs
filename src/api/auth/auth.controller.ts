import { NextFunction, Request, Response } from 'express'
import { AuthService } from './auth.service'
import { ResponseCode } from '../../interfaces'
import { getAccessCookieOptions } from '../../config'
import _ from 'lodash'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class AuthController {
  private readonly authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, password } = res.locals.input

    const { user, code } = await this.authService.registerUser({
      firstName,
      lastName,
      email,
      password
    })
    if (!user) {
      return next({ code })
    }

    return next({
      code: ResponseCode.OK
    })
  }

  resendRegistrationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { email } = res.locals.input
    const { code } = await this.authService.resendRegistrationEmail({
      email
    })

    return next({ code })
  }

  verifyRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let { uid, email } = res.locals.input

    const { code } = await this.authService.verifyRegistration({
      email,
      uid
    })

    return next({ code })
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
      'status',
      'password',
      'createdAt',
      'updatedAt'
    ])

    const { tokens, code: tokenCode } = await this.authService.signToken({
      user
    })
    if (!tokens) {
      return next({ code: tokenCode })
    }

    responseUser.accessTokenExpires = getAccessCookieOptions().expires

    return next({
      data: { user: { ...responseUser }, ...tokens },
      code: ResponseCode.OK
    })
  }

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.headers['refresh-token'] as string

    const { accessToken, code } = await this.authService.refreshToken({
      refreshToken
    })
    if (!accessToken) {
      return next({ code })
    }

    return next({
      data: {
        accessTokenExpires: getAccessCookieOptions().expires,
        accessToken
      },
      code: ResponseCode.OK
    })
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req

    await this.authService.logout({ userId: user.id })

    return next({ code: ResponseCode.OK })
  }

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req
    const { currentPassword, newPassword } = res.locals.input

    const { code } = await this.authService.changePassword({
      userId: user.id,
      currentPassword,
      newPassword
    })

    return next({ code })
  }

  sendResetPasswordEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { email } = res.locals.input

    const { code } = await this.authService.sendResetPasswordEmail({ email })

    return next({ code })
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, uid } = res.locals.input

    const { code } = await this.authService.resetPassword({
      email,
      password,
      uid
    })

    return next({ code })
  }

  delete = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req

    const { code } = await this.authService.deleteUser({ userId: user.id })

    return next({ code })
  }
}
