import 'reflect-metadata'
import { UserSessionService } from '../../src/api/user_session/userSessionService'
import { ResponseCode } from '../../src/common/response'
import { UserSessionStatus } from '../../src/api/user_session/interface'

// Mock dependencies
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
  },
  userSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@services/prisma', () => ({
  getPrismaClient: () => mockPrismaClient,
  isPrismaError: jest.fn(() => false),
  mapPrismaErrorToResponseCode: jest.fn(() => 500000),
}))

jest.mock('@services/bcrypt', () => ({
  hashString: jest.fn().mockResolvedValue('hashed_token'),
  compare: jest.fn().mockResolvedValue(true),
}))

jest.mock('@core/config', () => ({
  REFRESH_TOKEN_EXPIRES_IN: '1440', // 24 hours in minutes
}))

jest.mock('@common/decorators/serviceMethod', () => ({
  serviceMethod: (options?: any) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (err: unknown) {
        // Mock the error handling logic from the real decorator
        const { isPrismaError, mapPrismaErrorToResponseCode } = require('@services/prisma')
        
        if (options?.onError && err instanceof Error) {
          try {
            const errorResponse = await options.onError(err, {})
            if (errorResponse?.code) {
              return errorResponse
            }
          } catch (handlerError) {
            // Ignore handler errors for tests
          }
        }

        if (isPrismaError(err)) {
          const code = mapPrismaErrorToResponseCode(err)
          return { code }
        }

        return { code: 500000 } // SERVER_ERROR
      }
    }
    return descriptor
  },
  MINUTES_TO_MS: 60000,
}))

jest.mock('@core/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe('UserSessionService', () => {
  let userSessionService: UserSessionService

  beforeEach(() => {
    jest.clearAllMocks()
    userSessionService = new UserSessionService()
  })

  describe('storeUserSession', () => {
    it('should store user session successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { id: 'session-123', userId: 'user-123', expiresAt: new Date() }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(null)
      mockPrismaClient.userSession.create.mockResolvedValue(mockSession)

      const result = await userSessionService.storeUserSession({
        userId: 'user-123',
        refreshToken: 'refresh-token-123',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.userSession).toEqual(mockSession)
      expect(mockPrismaClient.userSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          refreshToken: 'hashed_token',
          expiresAt: expect.any(Date),
        },
      })
    })

    it('should invalidate existing session before creating new one', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockExistingSession = { id: 'existing-session', userId: 'user-123' }
      const mockNewSession = { id: 'new-session', userId: 'user-123', expiresAt: new Date() }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(mockExistingSession)
      mockPrismaClient.userSession.update.mockResolvedValue(mockExistingSession)
      mockPrismaClient.userSession.create.mockResolvedValue(mockNewSession)

      const result = await userSessionService.storeUserSession({
        userId: 'user-123',
        refreshToken: 'refresh-token-123',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.userSession.update).toHaveBeenCalledWith({
        where: { id: 'existing-session' },
        data: { status: 'LOGGED_OUT' },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userSessionService.storeUserSession({
        userId: 'nonexistent-user',
        refreshToken: 'refresh-token-123',
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
      expect(result).not.toHaveProperty('userSession')
    })
  })

  describe('getUserSession', () => {
    it('should return user session when found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { id: 'session-123', userId: 'user-123' }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(mockSession)

      const result = await userSessionService.getUserSession({ userId: 'user-123' })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.userSession).toEqual(mockSession)
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userSessionService.getUserSession({ userId: 'nonexistent-user' })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })

    it('should return USER_SESSION_NOT_FOUND when session does not exist', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(null)

      const result = await userSessionService.getUserSession({ userId: 'user-123' })

      expect(result.code).toBe(ResponseCode.USER_SESSION_NOT_FOUND)
    })
  })

  describe('updateUserSession', () => {
    it('should update user session successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { 
        id: 'session-123', 
        userId: 'user-123', 
        refreshToken: 'old_hashed_token',
        expiresAt: new Date()
      }
      const updatedSession = { 
        ...mockSession, 
        expiresAt: expect.any(Date) 
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(mockSession)
      mockPrismaClient.userSession.update.mockResolvedValue(updatedSession)

      const result = await userSessionService.updateUserSession({
        userId: 'user-123',
        oldRefreshToken: 'old-refresh-token',
        newRefreshToken: 'new-refresh-token',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.userSession).toEqual(updatedSession)
      expect(mockPrismaClient.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          refreshToken: 'hashed_token',
          expiresAt: expect.any(Date),
        },
      })
    })

    it('should return SESSION_EXPIRED when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userSessionService.updateUserSession({
        userId: 'nonexistent-user',
        oldRefreshToken: 'old-refresh-token',
        newRefreshToken: 'new-refresh-token',
      })

      expect(result.code).toBe(ResponseCode.SESSION_EXPIRED)
    })

    it('should return SESSION_EXPIRED when no active session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(null)

      const result = await userSessionService.updateUserSession({
        userId: 'user-123',
        oldRefreshToken: 'old-refresh-token',
        newRefreshToken: 'new-refresh-token',
      })

      expect(result.code).toBe(ResponseCode.SESSION_EXPIRED)
    })

    it('should return INVALID_TOKEN when refresh token does not match', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { 
        id: 'session-123', 
        userId: 'user-123', 
        refreshToken: 'hashed_token'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(mockSession)
      const { compare } = require('@services/bcrypt')
      compare.mockResolvedValue(false)

      const result = await userSessionService.updateUserSession({
        userId: 'user-123',
        oldRefreshToken: 'wrong-refresh-token',
        newRefreshToken: 'new-refresh-token',
      })

      expect(result.code).toBe(ResponseCode.INVALID_TOKEN)
    })
  })

  describe('expireUserSession', () => {
    it('should expire user session successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { id: 'session-123', userId: 'user-123' }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(mockSession)
      mockPrismaClient.userSession.update.mockResolvedValue(mockSession)

      const result = await userSessionService.expireUserSession({
        userId: 'user-123',
        status: UserSessionStatus.EXPIRED,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'EXPIRED' },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userSessionService.expireUserSession({
        userId: 'nonexistent-user',
        status: UserSessionStatus.EXPIRED,
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })

    it('should return USER_SESSION_NOT_FOUND when no active session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaClient.userSession.findFirst.mockResolvedValue(null)

      const result = await userSessionService.expireUserSession({
        userId: 'user-123',
        status: UserSessionStatus.EXPIRED,
      })

      expect(result.code).toBe(ResponseCode.USER_SESSION_NOT_FOUND)
    })
  })

  describe('Database error handling', () => {
    it('should handle database errors during session creation', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('@services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500001)
      
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: 'user-123' })
      mockPrismaClient.userSession.findFirst.mockRejectedValue(new Error('Database connection failed'))

      const result = await userSessionService.storeUserSession({
        userId: 'user-123',
        refreshToken: 'refresh-token-123',
      })

      expect(result.code).toBe(500001)
    })

    it('should handle database errors during session lookup', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('@services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500002)
      
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: 'user-123' })
      mockPrismaClient.userSession.findFirst.mockRejectedValue(new Error('Database timeout'))

      const result = await userSessionService.getUserSession({ userId: 'user-123' })

      expect(result.code).toBe(500002)
    })
  })
})
