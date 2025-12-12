import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'
import { AuthService } from './authService'
import { autoInjectable, singleton } from 'tsyringe'
import { randomBytes } from 'crypto'

@singleton()
@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public async login(req: Request, res: Response, next: NextFunction) {
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

    // For mobile clients, return tokens in response body (bearer token)
    // For web clients, set tokens in cookies
    if (AuthService.isMobileClient(req)) {
      return next({
        data: {
          user: responseUser,
          tokens,
        },
        code: ResponseCode.OK,
      })
    } else {
      AuthService.setAuthCookies(res, tokens)
      return next({
        data: {
          user: responseUser,
        },
        code: ResponseCode.OK,
      })
    }
  }

  public async register(req: Request, res: Response, next: NextFunction) {
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

    // For mobile clients, return tokens in response body (bearer token)
    // For web clients, set tokens in cookies
    if (AuthService.isMobileClient(req)) {
      return next({
        data: {
          user: responseUser,
          tokens,
        },
        code: ResponseCode.OK,
      })
    } else {
      AuthService.setAuthCookies(res, tokens)
      return next({
        data: {
          user: responseUser,
        },
        code: ResponseCode.OK,
      })
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction) {
    const refreshToken =
      (req.cookies?.refreshToken as string) ||
      (req.headers['refresh-token'] as string)

    if (!refreshToken) {
      return next({ code: ResponseCode.INVALID_TOKEN })
    }

    const { tokens, code } = await this.authService.refreshToken({
      refreshToken,
    })

    if (!tokens) {
      return next({ code })
    }

    if (AuthService.isMobileClient(req)) {
      return next({
        data: tokens,
        code: ResponseCode.OK,
      })
    } else {
      AuthService.setAuthCookies(res, tokens)
      return next({
        code: ResponseCode.OK,
      })
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction) {
    const { user } = req

    const { code } = await this.authService.logout({ userId: user.id })

    if (!AuthService.isMobileClient(req)) {
      AuthService.clearAuthCookies(res)
    }
    return next({ code })
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = res.locals.input

    const { code } = await this.authService.sendForgotPasswordEmail({ email })

    return next({ code })
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    const { uid, password } = res.locals.input

    const uids = uid.split('/')
    if (uids.length !== 2) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { code } = await this.authService.resetPassword({
      uid: uids[0],
      hashUid: uids[1],
      password,
    })

    return next({ code })
  }

  public async verifyLoginCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { loginCode, email, dontAskOnThisDevice } = res.locals.input

    // Generate device token if dontAskOnThisDevice is true
    let deviceToken: string | undefined
    if (dontAskOnThisDevice) {
      deviceToken = randomBytes(32).toString('hex')
    }

    const result = await this.authService.verifyLoginCode({
      loginCode,
      email,
      dontAskOnThisDevice,
      deviceToken,
    })

    if (!result.data) {
      return next({ code: result.code })
    }

    const { user, tokens } = result.data

    // Set auth cookies if not mobile client
    if (!AuthService.isMobileClient(req)) {
      AuthService.setAuthCookies(res, tokens)
    }

    // Set device token cookie if requested
    if (dontAskOnThisDevice && deviceToken) {
      AuthService.setDeviceTokenCookie(res, deviceToken)
    }

    const responseUser = {
      id: user.id,
    }

    return next({
      data: {
        user: responseUser,
        ...(AuthService.isMobileClient(req) ? { tokens } : {}),
        ...(dontAskOnThisDevice && deviceToken ? { deviceToken } : {}),
      },
      code: ResponseCode.OK,
    })
  }

  public async resendLoginCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email } = res.locals.input
    const { code } = await this.authService.resendLoginCode({
      email,
    })
    if (code !== ResponseCode.OK) {
      return next({ code })
    }

    return next({
      code: ResponseCode.OK,
    })
  }

  public async setNewPassword(req: Request, res: Response, next: NextFunction) {
    const { uid, password } = res.locals.input

    const uids = uid.split('/')
    if (uids.length !== 2) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const result = await this.authService.setNewPassword({
      uid: uids[0],
      hashUid: uids[1],
      password,
    })

    if (!result.userId) {
      return next({ code: result.code })
    }

    return next({
      code: ResponseCode.OK,
    })
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { uid } = res.locals.input

    const uids = uid.split('/')
    if (uids.length !== 2) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { code } = await this.authService.verifyEmail({
      uid: uids[0],
      hashUid: uids[1],
    })

    return next({ code })
  }

  public async resendVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email } = res.locals.input

    const { code } = await this.authService.resendVerificationEmail({ email })

    return next({ code })
  }

  public async sendPhoneVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { phoneNumber } = res.locals.input
    const { user } = req

    const { code } = await this.authService.sendPhoneVerificationCode({
      phoneNumber,
      userId: user.id,
    })

    return next({ code })
  }

  public async verifyPhoneCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { code: verificationCode } = res.locals.input
    const { user } = req

    const { code } = await this.authService.verifyPhoneCode({
      userId: user.id,
      code: verificationCode,
    })

    return next({ code })
  }
}
