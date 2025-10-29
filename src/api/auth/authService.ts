import { ResponseCode, serviceErrorHandler } from '@common'
import { UserService } from '@api/user/userService'
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

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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

  @serviceErrorHandler()
  async authenticatePassword({ user, password }: IAuthenticatePassword) {
    const passwordCorrect = await compare(password, user.password!)
    if (!passwordCorrect) {
      return { code: ResponseCode.WRONG_PASSWORD }
    }

    return { passwordCorrect, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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

  @serviceErrorHandler()
  async logout({ userId }: ILogout) {
    const { code: userSessionCode } =
      await this.userSessionService.expireUserSession({
        userId,
        status: UserSessionStatus.LOGGED_OUT,
      })

    return { code: userSessionCode }
  }

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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

  static COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
  }

  static setAuthCookies(
    res: any,
    tokens: {
      accessToken: string
      refreshToken: string
      accessTokenExpiresAt: Date
      refreshTokenExpiresAt: Date
    }
  ) {
    res.cookie('accessToken', tokens.accessToken, {
      ...AuthService.COOKIE_OPTIONS,
      expires: new Date(tokens.accessTokenExpiresAt),
    })
    res.cookie('refreshToken', tokens.refreshToken, {
      ...AuthService.COOKIE_OPTIONS,
      expires: new Date(tokens.refreshTokenExpiresAt),
    })
  }

  static clearAuthCookies(res: any) {
    res.clearCookie('accessToken', AuthService.COOKIE_OPTIONS)
    res.clearCookie('refreshToken', AuthService.COOKIE_OPTIONS)
  }

  static isMobileClient(req: any): boolean {
    return req.headers['x-client-type'] === 'mobile'
  }

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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

  @serviceErrorHandler()
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
}
