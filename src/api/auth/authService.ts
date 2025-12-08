import { ResponseCode, serviceMethod } from '@common'
import { UserService } from '@api/user/userService'
import { Response } from 'express'
import {
  ILogin,
  IAuthService,
  ILogout,
  IRefreshToken,
  IResetPassword,
  ISendForgotPasswordEmail,
  ISignToken,
  IAuthenticatePassword,
  IVerifyEmail,
  IResendVerificationEmail,
  ISendVerificationCode,
  IVerifyPhoneCode,
  IStoreDeviceToken,
  ISetNewPassword,
  IResendLoginCode,
  IVerifyLoginCode,
} from './interface'
import { TokenType, generateToken, verifyToken } from '@services/jsonwebtoken'
import config from '@core/config'
import { UserSessionService } from '@api/user_session/userSessionService'
import { UserSessionStatus } from '@api/user_session/interface'
import { autoInjectable, singleton } from 'tsyringe'
import { sendEmail } from '@services/aws-ses'
import { EmailTemplate } from '@services/aws-ses/interface'
import { VerificationUIDType } from '@api/verification_uid/interface'
import { VerificationUIDService } from '@api/verification_uid/verificationUIDService'
import { compare, hashString } from '@services/bcrypt'
import { sendSMS } from '@services/aws-end-user-messaging'
import { prisma } from '@app'
import { AuthType } from '@prisma/client'

@singleton()
@autoInjectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userSessionService: UserSessionService,
    private readonly verificationUIDService: VerificationUIDService
  ) {}

  @serviceMethod()
  async register({ authType, email, password }: ILogin) {
    const { user: existingUser } = await this.userService.getUserByEmail({
      email,
    })

    if (existingUser) {
      return { code: ResponseCode.USER_ALREADY_REGISTRED }
    }

    const { user, code: userCode } = await this.userService.createUser({
      authType,
      email,
      password,
    })

    if (!user) {
      return { code: userCode }
    }

    // Send verification email
    await this.sendVerificationEmail(user.id, user.email)

    return { user, code: ResponseCode.OK }
  }

  @serviceMethod()
  async login({ authType, email, password }: ILogin) {
    const { user, code: userCode } =
      await this.userService.getUserByEmailAndAuthType({
        email,
        authType,
      })

    if (!user) {
      return { code: userCode }
    }

    if (authType === AuthType.USER_PASSWORD && password) {
      const { passwordCorrect, code: authCode } =
        await this.authenticatePassword({
          user,
          password,
        })
      if (!passwordCorrect) {
        return { code: authCode }
      }
    }

    return { user, code: ResponseCode.OK }
  }

  @serviceMethod()
  async authenticatePassword({ user, password }: IAuthenticatePassword) {
    const passwordCorrect = await compare(password, user.password!)
    if (!passwordCorrect) {
      return { code: ResponseCode.WRONG_PASSWORD }
    }

    return { passwordCorrect, code: ResponseCode.OK }
  }

  @serviceMethod()
  async signToken({ user }: ISignToken) {
    const accessToken = generateToken(
      {
        sub: user.id,
      },
      TokenType.ACCESS_TOKEN
    )
    const refreshToken = generateToken(
      { sub: user.id },
      TokenType.REFRESH_TOKEN
    )
    const { userSession, code: userSessionCode } =
      await this.userSessionService.storeUserSession({
        userId: user.id,
        refreshToken,
      })
    if (!userSession) {
      return { code: userSessionCode }
    }
    const expiresAt = new Date(
      Date.now() + Number(config.ACCESS_TOKEN_EXPIRES_IN) * 60 * 1000
    )
    return {
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: expiresAt,
        refreshTokenExpiresAt: userSession.expiresAt,
      },
      code: ResponseCode.OK,
    }
  }

  @serviceMethod()
  async refreshToken({ refreshToken }: IRefreshToken) {
    const decodedToken = verifyToken<{ sub: string; exp: number }>(
      refreshToken,
      TokenType.REFRESH_TOKEN
    )
    if (!decodedToken) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const refreshTokenExpiry = new Date(decodedToken.exp * 1000)
    if (refreshTokenExpiry < new Date()) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    const newRefreshToken = generateToken(
      {
        sub: decodedToken.sub,
      },
      TokenType.REFRESH_TOKEN
    )

    const { userSession, code: updateUserSessionCode } =
      await this.userSessionService.updateUserSession({
        userId: decodedToken.sub,
        refreshToken: newRefreshToken,
      })
    if (!userSession) {
      return { code: updateUserSessionCode }
    }

    const accessToken = generateToken(
      {
        sub: decodedToken.sub,
      },
      TokenType.ACCESS_TOKEN
    )
    const expiresAt = new Date(
      Date.now() + Number(config.ACCESS_TOKEN_EXPIRES_IN) * 60 * 1000
    )

    return {
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: expiresAt,
        refreshTokenExpiresAt: userSession.expiresAt,
      },
      code: ResponseCode.OK,
    }
  }

  @serviceMethod()
  async logout({ userId }: ILogout) {
    const { code: userSessionCode } =
      await this.userSessionService.expireUserSession({
        userId,
        status: UserSessionStatus.LOGGED_OUT,
      })

    return { code: userSessionCode }
  }

  @serviceMethod()
  async sendForgotPasswordEmail({ email }: ISendForgotPasswordEmail) {
    const { user, code: userCode } = await this.userService.getUserByEmail({
      email,
    })
    if (!user) {
      return { code: userCode }
    }

    const { uids, code: uidCode } =
      await this.verificationUIDService.setVerificationUID({
        userId: user.id,
        type: VerificationUIDType.RESET_PASSWORD,
      })
    if (!uids) {
      return { code: uidCode }
    }

    const resetPasswordUrl = `${config.API_BASE_URL}/reset-password?uid=${uids.uid}&hashUid=${uids.hashUID}`
    await sendEmail(
      EmailTemplate.RESET_PASSWORD,
      user.email,
      'Reset your password',
      { reset_password_url: resetPasswordUrl }
    )

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async resetPassword({ uid, hashUid, password }: IResetPassword) {
    const { verificationUID, code: verificationUIDCode } =
      await this.verificationUIDService.verifyUID({
        uid,
        hashUid,
        type: VerificationUIDType.RESET_PASSWORD,
      })
    if (!verificationUID) {
      return { code: verificationUIDCode }
    }

    const hashedPassword = await hashString(password)

    const { code: editCode } = await this.userService.updatePassword({
      userId: verificationUID.userId,
      password: hashedPassword,
    })
    if (editCode != ResponseCode.OK) {
      return { code: editCode }
    }

    await this.verificationUIDService.clearVerificationUID({
      userId: verificationUID.userId,
      type: VerificationUIDType.RESET_PASSWORD,
    })

    return { code: ResponseCode.OK }
  }

  private static readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
  }

  private static readonly DEVICE_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

  /**
   * Sets authentication cookies (access and refresh tokens) on the response
   */
  static setAuthCookies(
    res: Response,
    tokens: {
      accessToken: string
      refreshToken: string
      accessTokenExpiresAt: Date
      refreshTokenExpiresAt: Date
    }
  ): void {
    res.cookie('accessToken', tokens.accessToken, {
      ...AuthService.COOKIE_OPTIONS,
      expires: tokens.accessTokenExpiresAt,
    })
    res.cookie('refreshToken', tokens.refreshToken, {
      ...AuthService.COOKIE_OPTIONS,
      expires: tokens.refreshTokenExpiresAt,
    })
  }

  /**
   * Sets device token cookie on the response
   */
  static setDeviceTokenCookie(res: Response, deviceToken: string): void {
    res.cookie('deviceToken', deviceToken, {
      ...AuthService.COOKIE_OPTIONS,
      maxAge: AuthService.DEVICE_TOKEN_MAX_AGE,
    })
  }

  /**
   * Clears authentication cookies from the response
   */
  static clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', AuthService.COOKIE_OPTIONS)
    res.clearCookie('refreshToken', AuthService.COOKIE_OPTIONS)
  }

  /**
   * Checks if the request is from a mobile client
   */
  static isMobileClient(req: { headers: Record<string, unknown> }): boolean {
    return req.headers['x-client-type'] === 'mobile'
  }

  @serviceMethod()
  async sendVerificationEmail(userId: string, email: string) {
    const { uids, code: uidCode } =
      await this.verificationUIDService.setVerificationUID({
        userId,
        type: VerificationUIDType.EMAIL_VERIFICATION,
      })
    if (!uids) {
      return { code: uidCode }
    }

    const verificationUrl = `${config.API_BASE_URL}/auth/verify-email?uid=${uids.uid}&hashUid=${uids.hashUID}`
    await sendEmail(
      EmailTemplate.VERIFY_EMAIL,
      email,
      'Verify your email address',
      { verification_url: verificationUrl }
    )

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async verifyEmail({ uid, hashUid }: IVerifyEmail) {
    const { verificationUID, code: verificationUIDCode } =
      await this.verificationUIDService.verifyUID({
        uid,
        hashUid,
        type: VerificationUIDType.EMAIL_VERIFICATION,
      })
    if (!verificationUID) {
      return { code: verificationUIDCode }
    }

    const { code: updateCode } = await this.userService.updateUser({
      userId: verificationUID.userId,
      emailVerified: true,
    })
    if (updateCode !== ResponseCode.OK) {
      return { code: updateCode }
    }

    await this.verificationUIDService.clearVerificationUID({
      userId: verificationUID.userId,
      type: VerificationUIDType.EMAIL_VERIFICATION,
    })

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async resendVerificationEmail({ email }: IResendVerificationEmail) {
    const { user, code: userCode } = await this.userService.getUserByEmail({
      email,
    })
    if (!user) {
      return { code: userCode }
    }

    if (user.emailVerified) {
      return { code: ResponseCode.USER_ALREADY_ONBOARDED }
    }

    return await this.sendVerificationEmail(user.id, user.email)
  }

  @serviceMethod()
  async sendPhoneVerificationCode({
    phoneNumber,
    userId,
  }: ISendVerificationCode) {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing codes for this user
    await prisma.phoneVerificationCode.deleteMany({
      where: { userId },
    })

    // Store the code
    await prisma.phoneVerificationCode.create({
      data: {
        userId,
        phoneNumber,
        code,
        expiresAt,
      },
    })

    // Send SMS
    const message = `Your verification code is: ${code}. This code will expire in 10 minutes.`
    const { code: smsCode } = await sendSMS(phoneNumber, message)

    if (smsCode !== ResponseCode.OK) {
      return { code: smsCode }
    }

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async verifyPhoneCode({ userId, code }: IVerifyPhoneCode) {
    const verificationCode = await prisma.phoneVerificationCode.findFirst({
      where: {
        userId,
        code,
      },
    })

    if (!verificationCode) {
      return { code: ResponseCode.INVALID_INPUT }
    }

    if (verificationCode.expiresAt < new Date()) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    // Update user's phone verification status
    const { code: updateCode } = await this.userService.updateUser({
      userId,
      phoneNumber: verificationCode.phoneNumber,
      phoneVerified: true,
    })

    if (updateCode !== ResponseCode.OK) {
      return { code: updateCode }
    }

    // Delete the verification code
    await prisma.phoneVerificationCode.delete({
      where: { id: verificationCode.id },
    })

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async storeDeviceToken({
    deviceToken,
    userId,
    expiresInDays = 30,
  }: IStoreDeviceToken) {
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    // Delete any existing token for this device
    await prisma.deviceToken.deleteMany({
      where: { token: deviceToken },
    })

    // Store the new device token
    await prisma.deviceToken.create({
      data: {
        userId,
        token: deviceToken,
        expiresAt,
      },
    })

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async verifyDeviceToken(deviceToken: string) {
    const storedToken = await prisma.deviceToken.findUnique({
      where: { token: deviceToken },
    })

    if (!storedToken) {
      return { isValid: false, userId: null, code: ResponseCode.INVALID_INPUT }
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.deviceToken.delete({
        where: { id: storedToken.id },
      })
      return {
        isValid: false,
        userId: null,
        code: ResponseCode.SESSION_EXPIRED,
      }
    }

    return { isValid: true, userId: storedToken.userId, code: ResponseCode.OK }
  }

  @serviceMethod()
  async setNewPassword({ uid, hashUid, password }: ISetNewPassword) {
    const { verificationUID, code: verificationUIDCode } =
      await this.verificationUIDService.verifyUID({
        uid,
        hashUid,
        type: VerificationUIDType.RESET_PASSWORD,
      })
    if (!verificationUID) {
      return { code: verificationUIDCode }
    }

    const hashedPassword = await hashString(password)

    const { code: updateCode } = await this.userService.updatePassword({
      userId: verificationUID.userId,
      password: hashedPassword,
    })
    if (updateCode !== ResponseCode.OK) {
      return { code: updateCode }
    }

    await this.verificationUIDService.clearVerificationUID({
      userId: verificationUID.userId,
      type: VerificationUIDType.RESET_PASSWORD,
    })

    return { userId: verificationUID.userId, code: ResponseCode.OK }
  }

  @serviceMethod()
  async resendLoginCode({ email }: IResendLoginCode) {
    // Verify user exists
    const { user, code: userCode } = await this.userService.getUserByEmail({
      email,
    })
    if (!user) {
      return { code: userCode }
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing codes for this email
    await prisma.loginCode.deleteMany({
      where: { email },
    })

    // Store the code
    await prisma.loginCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    })

    // Send email with the code
    await sendEmail(
      EmailTemplate.VERIFY_LOGIN,
      email,
      'Your login verification code',
      { login_code: code }
    )

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async verifyLoginCode({
    loginCode,
    email,
    dontAskOnThisDevice,
    deviceToken,
  }: IVerifyLoginCode) {
    const { user, code: userCode } = await this.userService.getUserByEmail({
      email,
    })
    if (!user) {
      return { code: userCode }
    }

    // Find the login code
    const storedCode = await prisma.loginCode.findFirst({
      where: {
        email,
        code: loginCode,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!storedCode) {
      return { code: ResponseCode.INVALID_INPUT }
    }

    // Check if code is expired
    if (storedCode.expiresAt < new Date()) {
      return { code: ResponseCode.SESSION_EXPIRED }
    }

    // Delete the used code
    await prisma.loginCode.delete({
      where: { id: storedCode.id },
    })

    // If dontAskOnThisDevice is true and deviceToken is provided, store it
    if (dontAskOnThisDevice && deviceToken) {
      await this.storeDeviceToken({
        deviceToken,
        userId: user.id,
        expiresInDays: 30,
      })
    }

    const { tokens, code: tokenCode } = await this.signToken({
      user,
    })

    if (!tokens) {
      return { code: tokenCode }
    }

    return {
      data: {
        user,
        tokens,
      },
      code: ResponseCode.OK,
    }
  }
}
