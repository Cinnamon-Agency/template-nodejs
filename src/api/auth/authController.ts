import { NextFunction, Request, Response } from 'express'
import { logEndpoint } from '@common/decorators/logEndpoint'
import { ResponseCode } from '@common'
import { AuthService } from './authService'
import { autoInjectable, singleton } from 'tsyringe'
import { randomBytes } from 'crypto'



@singleton()
@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @logEndpoint()
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

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(tokens.accessTokenExpiresAt),
    })
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(tokens.refreshTokenExpiresAt),
    })
    return next({
      data: {
        user: responseUser,
      },
      code: ResponseCode.OK,
    })
  }

  @logEndpoint()
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

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(tokens.accessTokenExpiresAt),
    })
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(tokens.refreshTokenExpiresAt),
    })
    return next({
      data: {
        user: responseUser,
      },
      code: ResponseCode.OK,
    })
  }

  @logEndpoint()
  public async refreshToken(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.headers['refresh-token'] as string

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

  @logEndpoint()
  public async logout(req: Request, res: Response, next: NextFunction) {
    const { user } = req

    const { code } = await this.authService.logout({ userId: user.id })

    if (!AuthService.isMobileClient(req)) {
      AuthService.clearAuthCookies(res)
    }
    return next({ code })
  }

  @logEndpoint()
  public async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = res.locals.input

    const { code } = await this.authService.sendForgotPasswordEmail({ email })

    return next({ code })
  }

  @logEndpoint()
  public async resetPassword(req: Request, res: Response, next: NextFunction) {
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

  @logEndpoint()
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
      res.cookie('deviceToken', deviceToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
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

  @logEndpoint()
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

  @logEndpoint()
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

  @logEndpoint()
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

  @logEndpoint()
  public async resendVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email } = res.locals.input

    const { code } = await this.authService.resendVerificationEmail({ email })

    return next({ code })
  }

  @logEndpoint()
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

  @logEndpoint()
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
