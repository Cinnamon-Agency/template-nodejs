import 'reflect-metadata'
import { AuthService } from '../../src/api/auth/authService'
import { ResponseCode } from '../../src/common/response'
import { AuthType } from '@prisma/client'

// Mock dependencies
const mockUserService = {
  getUserByEmail: jest.fn(),
  getUserByEmailAndAuthType: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  updatePassword: jest.fn(),
}

const mockUserSessionService = {
  storeUserSession: jest.fn(),
  updateUserSession: jest.fn(),
  expireUserSession: jest.fn(),
}

const mockVerificationUIDService = {
  setVerificationUID: jest.fn(),
  verifyUID: jest.fn(),
  clearVerificationUID: jest.fn(),
}

jest.mock('../../src/services/jsonwebtoken', () => ({
  generateToken: jest.fn((payload, type) => `mock-${type}-${payload.sub}`),
  verifyToken: jest.fn((token) => {
    if (token === 'valid-refresh-token') {
      return { sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 }
    }
    if (token === 'expired-refresh-token') {
      return { sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 }
    }
    return null
  }),
  TokenType: {
    ACCESS_TOKEN: 'access',
    REFRESH_TOKEN: 'refresh',
  },
}))

jest.mock('../../src/services/aws-ses', () => ({
  sendEmail: jest.fn().mockResolvedValue({ code: 200000 }),
  EmailTemplate: {
    VERIFY_EMAIL: 'VERIFY_EMAIL',
    RESET_PASSWORD: 'RESET_PASSWORD',
    VERIFY_LOGIN: 'VERIFY_LOGIN',
  },
}))

jest.mock('../../src/services/bcrypt', () => ({
  compare: jest.fn(),
}))

jest.mock('../../src/services/aws-end-user-messaging', () => ({
  sendSMS: jest.fn().mockResolvedValue({ code: 200000 }),
}))

jest.mock('../../src/services/prisma', () => ({
  getPrismaClient: () => ({
    phoneVerificationCode: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    deviceToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    loginCode: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  }),
  isPrismaError: jest.fn(() => false),
  mapPrismaErrorToResponseCode: jest.fn(() => 500000),
}))

jest.mock('@core/config', () => ({
  NODE_ENV: 'test',
  API_BASE_URL: 'http://localhost:3000',
  ACCESS_TOKEN_EXPIRES_IN: '15',
}))

jest.mock('@core/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService(
      mockUserService as any,
      mockUserSessionService as any,
      mockVerificationUIDService as any
    )
  })

  describe('register', () => {
    it('should register user successfully', async () => {
      mockUserService.getUserByEmail.mockResolvedValue({ user: null, code: ResponseCode.USER_NOT_FOUND })
      mockUserService.createUser.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        code: ResponseCode.OK,
      })
      mockVerificationUIDService.setVerificationUID.mockResolvedValue({
        uids: { uid: 'uid-123', hashUID: 'hash-123' },
        code: ResponseCode.OK,
      })

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.user).toEqual({ id: 'user-123', email: 'test@example.com' })
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        authType: AuthType.USER_PASSWORD,
      })
    })

    it('should return error if user already exists', async () => {
      mockUserService.getUserByEmail.mockResolvedValue({
        user: { id: 'existing-user', email: 'test@example.com' },
        code: ResponseCode.OK,
      })

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(ResponseCode.USER_ALREADY_REGISTERED)
      expect(mockUserService.createUser).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', password: 'hashed' }
      mockUserService.getUserByEmailAndAuthType.mockResolvedValue({
        user: mockUser,
        code: ResponseCode.OK,
      })
      const { compare } = require('../../src/services/bcrypt')
      compare.mockResolvedValue(true)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.user).toEqual(mockUser)
    })

    it('should return error for wrong password', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', password: 'hashed' }
      mockUserService.getUserByEmailAndAuthType.mockResolvedValue({
        user: mockUser,
        code: ResponseCode.OK,
      })
      const { compare } = require('../../src/services/bcrypt')
      compare.mockResolvedValue(false)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(ResponseCode.WRONG_PASSWORD)
    })

    it('should login OAuth user without password', async () => {
      const mockUser = { id: 'user-123', email: 'oauth@example.com', authType: AuthType.GOOGLE }
      mockUserService.getUserByEmailAndAuthType.mockResolvedValue({
        user: mockUser,
        code: ResponseCode.OK,
      })

      const result = await authService.login({
        email: 'oauth@example.com',
        authType: AuthType.GOOGLE,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.user).toEqual(mockUser)
    })
  })

  describe('authenticatePassword', () => {
    it('should return true for correct password', async () => {
      const { compare } = require('../../src/services/bcrypt')
      compare.mockResolvedValue(true)

      const result = await authService.authenticatePassword({
        user: { id: 'user-123', email: 'test@example.com', authType: AuthType.USER_PASSWORD, password: 'hashed', emailVerified: false, phoneNumber: null, phoneVerified: false, notifications: false, profilePictureFileName: null, createdAt: new Date(), updatedAt: new Date() },
        password: 'correctpassword',
      })

      expect(result.passwordCorrect).toBe(true)
      expect(result.code).toBe(ResponseCode.OK)
    })

    it('should return false for incorrect password', async () => {
      const { compare } = require('../../src/services/bcrypt')
      compare.mockResolvedValue(false)

      const result = await authService.authenticatePassword({
        user: { id: 'user-123', email: 'test@example.com', authType: AuthType.USER_PASSWORD, password: 'hashed', emailVerified: false, phoneNumber: null, phoneVerified: false, notifications: false, profilePictureFileName: null, createdAt: new Date(), updatedAt: new Date() },
        password: 'wrongpassword',
      })

      expect(result.code).toBe(ResponseCode.WRONG_PASSWORD)
    })
  })

  describe('signToken', () => {
    it('should sign tokens successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', authType: AuthType.USER_PASSWORD, password: null, emailVerified: false, phoneNumber: null, phoneVerified: false, notifications: false, profilePictureFileName: null, createdAt: new Date(), updatedAt: new Date() }
      mockUserSessionService.storeUserSession.mockResolvedValue({
        userSession: { id: 'session-123', expiresAt: new Date() },
        code: ResponseCode.OK,
      })

      const result = await authService.signToken({ user: mockUser })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.tokens).toHaveProperty('accessToken')
      expect(result.tokens).toHaveProperty('refreshToken')
      expect(result.tokens).toHaveProperty('accessTokenExpiresAt')
      expect(result.tokens).toHaveProperty('refreshTokenExpiresAt')
    })

    it('should return error if session storage fails', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', authType: AuthType.USER_PASSWORD, password: null, emailVerified: false, phoneNumber: null, phoneVerified: false, notifications: false, profilePictureFileName: null, createdAt: new Date(), updatedAt: new Date() }
      mockUserSessionService.storeUserSession.mockResolvedValue({
        userSession: null,
        code: ResponseCode.SERVER_ERROR,
      })

      const result = await authService.signToken({ user: mockUser })

      expect(result.code).toBe(ResponseCode.SERVER_ERROR)
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockUserSessionService.updateUserSession.mockResolvedValue({
        userSession: { id: 'session-123', expiresAt: new Date() },
        code: ResponseCode.OK,
      })

      const result = await authService.refreshToken({
        refreshToken: 'valid-refresh-token',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.tokens).toHaveProperty('accessToken')
      expect(result.tokens).toHaveProperty('refreshToken')
    })

    it('should return error for invalid token', async () => {
      const result = await authService.refreshToken({
        refreshToken: 'invalid-token',
      })

      expect(result.code).toBe(ResponseCode.SESSION_EXPIRED)
    })

    it('should return error for expired token', async () => {
      const result = await authService.refreshToken({
        refreshToken: 'expired-refresh-token',
      })

      expect(result.code).toBe(ResponseCode.SESSION_EXPIRED)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockUserSessionService.expireUserSession.mockResolvedValue({
        code: ResponseCode.OK,
      })

      const result = await authService.logout({ userId: 'user-123' })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockUserSessionService.expireUserSession).toHaveBeenCalledWith({
        userId: 'user-123',
        status: 'LoggedOut',
      })
    })
  })

  describe('sendForgotPasswordEmail', () => {
    it('should send forgot password email successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockUserService.getUserByEmail.mockResolvedValue({
        user: mockUser,
        code: ResponseCode.OK,
      })
      mockVerificationUIDService.setVerificationUID.mockResolvedValue({
        uids: { uid: 'uid-123', hashUID: 'hash-123' },
        code: ResponseCode.OK,
      })

      const result = await authService.sendForgotPasswordEmail({
        email: 'test@example.com',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
    })

    it('should return error if user does not exist', async () => {
      mockUserService.getUserByEmail.mockResolvedValue({
        user: null,
        code: ResponseCode.USER_NOT_FOUND,
      })

      const result = await authService.sendForgotPasswordEmail({
        email: 'nonexistent@example.com',
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockVerificationUID = { userId: 'user-123' }
      mockVerificationUIDService.verifyUID.mockResolvedValue({
        verificationUID: mockVerificationUID,
        code: ResponseCode.OK,
      })
      mockUserService.updatePassword.mockResolvedValue({
        code: ResponseCode.OK,
      })

      const result = await authService.resetPassword({
        uid: 'uid-123',
        hashUid: 'hash-123',
        password: 'newpassword123',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockUserService.updatePassword).toHaveBeenCalledWith({
        userId: 'user-123',
        password: 'newpassword123',
      })
    })

    it('should return error for invalid verification UID', async () => {
      mockVerificationUIDService.verifyUID.mockResolvedValue({
        verificationUID: null,
        code: ResponseCode.INVALID_INPUT,
      })

      const result = await authService.resetPassword({
        uid: 'invalid-uid',
        hashUid: 'invalid-hash',
        password: 'newpassword123',
      })

      expect(result.code).toBe(ResponseCode.INVALID_INPUT)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockVerificationUID = { userId: 'user-123' }
      mockVerificationUIDService.verifyUID.mockResolvedValue({
        verificationUID: mockVerificationUID,
        code: ResponseCode.OK,
      })
      mockUserService.updateUser.mockResolvedValue({
        code: ResponseCode.OK,
      })

      const result = await authService.verifyEmail({
        uid: 'uid-123',
        hashUid: 'hash-123',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockUserService.updateUser).toHaveBeenCalledWith({
        userId: 'user-123',
        emailVerified: true,
      })
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', emailVerified: false }
      mockUserService.getUserByEmail.mockResolvedValue({
        user: mockUser,
        code: ResponseCode.OK,
      })
      mockVerificationUIDService.setVerificationUID.mockResolvedValue({
        uids: { uid: 'uid-123', hashUID: 'hash-123' },
        code: ResponseCode.OK,
      })

      const result = await authService.resendVerificationEmail({
        email: 'test@example.com',
      })

      expect(result.code).toBe(ResponseCode.OK)
    })

    it('should return error if email is already verified', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', emailVerified: true }
      mockUserService.getUserByEmail.mockResolvedValue({
        user: mockUser,
        code: ResponseCode.OK,
      })

      const result = await authService.resendVerificationEmail({
        email: 'test@example.com',
      })

      expect(result.code).toBe(ResponseCode.USER_ALREADY_ONBOARDED)
    })
  })
})
