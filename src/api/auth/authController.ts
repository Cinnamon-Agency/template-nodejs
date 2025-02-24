import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'
import { AuthService } from './authService'
import { autoInjectable, singleton } from 'tsyringe'

@singleton()
@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { authType, email, password } = res.locals.input

    const { user, code } = await this.authService.login({
      authType,
      email,
      password,
    })
    if (!user) {
      return next({ code })
    }

    const { tokens, code: tokenCode } = await this.authService.signToken({
      user,
    })

    if (!tokens) {
      return next({ code: tokenCode })
    }

    const responseUser = {
      id: user.id,
    }

    return next({
      data: {
        user: responseUser,
        ...tokens,
      },
      code: ResponseCode.OK,
    })
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    const { authType, email, password } = res.locals.input

    const { user, code } = await this.authService.register({
      authType,
      email,
      password,
    })

    if (!user) {
      return next({ code })
    }

    const { tokens, code: tokenCode } = await this.authService.signToken({
      user,
    })

    if (!tokens) {
      return next({ code: tokenCode })
    }

    const responseUser = {
      id: user.id,
    }

    return next({
      data: {
        user: responseUser,
        ...tokens,
      },
      code: ResponseCode.OK,
    })
  }

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.headers['refresh-token'] as string

    const { tokens, code } = await this.authService.refreshToken({
      refreshToken,
    })

    if (!tokens) {
      return next({ code })
    }

    return next({
      data: tokens,
      code: ResponseCode.OK,
    })
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req

    const { code } = await this.authService.logout({ userId: user.id })

    return next({ code })
  }

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = res.locals.input

    const { code } = await this.authService.sendForgotPasswordEmail({ email })

    return next({ code })
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { uid, password } = res.locals.input

    const uids = uid.split('/')
    if (uids.length > 2) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { code } = await this.authService.resetPassword({
      uid: uids[0],
      hashUid: uids[1],
      password,
    })

    return next({ code })
  }
}
