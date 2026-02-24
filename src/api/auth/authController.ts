// Node.js modules
import { NextFunction, Request, Response } from 'express'

// External libraries
import { randomBytes } from 'crypto'
import { autoInjectable, singleton } from 'tsyringe'

// Internal modules
import { ResponseCode, DEVICE_TOKEN_BYTES } from '@common'
import { AuthService } from './authService'

interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

@singleton()
@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Parses a compound UID string (e.g. "uuid1/uuid2") into its two parts.
   * Returns null if the format is invalid.
   */
  private parseUidPair(uid: string): { uid: string; hashUid: string } | null {
    const parts = uid.split('/')
    if (parts.length !== 2) return null
    return { uid: parts[0], hashUid: parts[1] }
  }

  /**
   * Shared logic for signing tokens and returning the appropriate response
   * for both mobile (bearer) and web (cookie) clients.
   */
  private respondWithTokens(
    req: Request,
    res: Response,
    next: NextFunction,
    user: { id: string },
    tokens: AuthTokens,
    extraData?: Record<string, unknown>
  ) {
    const responseUser = { id: user.id }

    if (AuthService.isMobileClient(req)) {
      return next({
        data: { user: responseUser, tokens, ...extraData },
        code: ResponseCode.OK,
      })
    }

    AuthService.setAuthCookies(res, tokens)
    return next({
      data: { user: responseUser, ...extraData },
      code: ResponseCode.OK,
    })
  }

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

    return this.respondWithTokens(req, res, next, user, tokens)
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

    return this.respondWithTokens(req, res, next, user, tokens)
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

    const parsed = this.parseUidPair(uid)
    if (!parsed) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { code } = await this.authService.resetPassword({
      uid: parsed.uid,
      hashUid: parsed.hashUid,
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

    let deviceToken: string | undefined
    if (dontAskOnThisDevice) {
      deviceToken = randomBytes(DEVICE_TOKEN_BYTES).toString('hex')
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

    if (!AuthService.isMobileClient(req)) {
      AuthService.setAuthCookies(res, tokens)
    }

    if (dontAskOnThisDevice && deviceToken) {
      AuthService.setDeviceTokenCookie(res, deviceToken)
    }

    const extraData: Record<string, unknown> = {}
    if (AuthService.isMobileClient(req)) {
      extraData.tokens = tokens
    }
    if (dontAskOnThisDevice && deviceToken) {
      extraData.deviceToken = deviceToken
    }

    return next({
      data: { user: { id: user.id }, ...extraData },
      code: ResponseCode.OK,
    })
  }

  public async resendLoginCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email } = res.locals.input
    const { code } = await this.authService.resendLoginCode({ email })

    return next({ code })
  }

  public async setNewPassword(req: Request, res: Response, next: NextFunction) {
    const { uid, password } = res.locals.input

    const parsed = this.parseUidPair(uid)
    if (!parsed) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const result = await this.authService.setNewPassword({
      uid: parsed.uid,
      hashUid: parsed.hashUid,
      password,
    })

    if (!result.userId) {
      return next({ code: result.code })
    }

    return next({ code: ResponseCode.OK })
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { uid } = res.locals.input

    const parsed = this.parseUidPair(uid)
    if (!parsed) {
      return next({ code: ResponseCode.INVALID_UID })
    }

    const { code } = await this.authService.verifyEmail({
      uid: parsed.uid,
      hashUid: parsed.hashUid,
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
