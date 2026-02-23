import 'reflect-metadata'
import { UserService } from '../../src/api/user/userService'
import { ResponseCode } from '../../src/common/response'
import { AuthType } from '@prisma/client'

// Mock getPrismaClient
const mockPrismaClient = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('../../src/services/prisma', () => ({
  getPrismaClient: () => mockPrismaClient,
  isPrismaError: jest.fn(() => false),
  mapPrismaErrorToResponseCode: jest.fn(() => 500000),
}))

jest.mock('@core/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

// Mock cache service
jest.mock('../../src/services/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  },
  CacheKeys: {
    userById: (id: string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,
  },
  CacheTTL: {
    USER: 300,
  },
}))

// Mock bcrypt service
jest.mock('../../src/services/bcrypt', () => ({
  hashString: jest.fn().mockResolvedValue('hashed_password'),
}))

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    jest.clearAllMocks()
    userService = new UserService()
  })

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createdUser = {
        id: 'uuid-1',
        email: 'test@example.com',
        password: 'hashed_password',
        authType: AuthType.USER_PASSWORD,
        emailVerified: false,
        phoneNumber: null,
        phoneVerified: false,
        notifications: false,
        profilePictureFileName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaClient.user.create.mockResolvedValue(createdUser)

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result).toHaveProperty('user')
      expect((result as any).user.email).toBe('test@example.com')
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed_password',
          authType: AuthType.USER_PASSWORD,
        },
      })
    })

    it('should create a user without password for OAuth', async () => {
      const createdUser = {
        id: 'uuid-2',
        email: 'oauth@example.com',
        password: null,
        authType: AuthType.GOOGLE,
        emailVerified: false,
        phoneNumber: null,
        phoneVerified: false,
        notifications: false,
        profilePictureFileName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaClient.user.create.mockResolvedValue(createdUser)

      const result = await userService.createUser({
        email: 'oauth@example.com',
        authType: AuthType.GOOGLE,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect((result as any).user.password).toBeNull()
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauth@example.com',
          password: null,
          authType: AuthType.GOOGLE,
        },
      })
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        password: 'hashed_password',
        authType: AuthType.USER_PASSWORD,
        emailVerified: false,
        phoneNumber: null,
        phoneVerified: false,
        notifications: false,
        profilePictureFileName: null,
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)

      const result = await userService.getUserById({ userId: 'uuid-1' })

      expect(result.code).toBe(ResponseCode.OK)
      expect((result as any).user).toEqual(user)
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        include: { roles: { include: { role: true } } },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.getUserById({ userId: 'nonexistent' })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
      expect(result).not.toHaveProperty('user')
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when found by email', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        authType: AuthType.USER_PASSWORD,
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)

      const result = await userService.getUserByEmail({ email: 'test@example.com' })

      expect(result.code).toBe(ResponseCode.OK)
      expect((result as any).user.email).toBe('test@example.com')
    })

    it('should return USER_NOT_FOUND when email does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.getUserByEmail({ email: 'nonexistent@example.com' })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })
  })

  describe('toggleNotifications', () => {
    it('should toggle notifications from false to true', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        notifications: false,
      }

      const updatedUser = { ...user, notifications: true }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const result = await userService.toggleNotifications({ userId: 'uuid-1' })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { notifications: true },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.toggleNotifications({ userId: 'nonexistent' })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })
  })

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      mockPrismaClient.user.update.mockResolvedValue({ ...user, password: 'new_hashed' })

      const result = await userService.updatePassword({
        userId: 'uuid-1',
        password: 'newpassword123',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { password: 'hashed_password' },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.updatePassword({
        userId: 'nonexistent',
        password: 'newpassword123',
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })
  })

  describe('updateUser', () => {
    it('should update user fields successfully', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        emailVerified: false,
        phoneNumber: null,
        phoneVerified: false,
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      mockPrismaClient.user.update.mockResolvedValue({
        ...user,
        emailVerified: true,
        phoneNumber: '+1234567890',
      })

      const result = await userService.updateUser({
        userId: 'uuid-1',
        emailVerified: true,
        phoneNumber: '+1234567890',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: {
          emailVerified: true,
          phoneNumber: '+1234567890',
        },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.updateUser({
        userId: 'nonexistent',
        emailVerified: true,
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })

    it('should update phoneVerified field successfully', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        emailVerified: false,
        phoneNumber: '+1234567890',
        phoneVerified: false,
      }

      const updatedUser = { ...user, phoneVerified: true }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const result = await userService.updateUser({
        userId: 'uuid-1',
        phoneVerified: true,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: {
          phoneVerified: true,
        },
      })
    })
  })

  describe('getUserByEmailAndAuthType', () => {
    it('should return user when found by email and auth type', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        authType: AuthType.GOOGLE,
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)

      const result = await userService.getUserByEmailAndAuthType({
        email: 'test@example.com',
        authType: AuthType.GOOGLE,
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect((result as any).user.email).toBe('test@example.com')
      expect((result as any).user.authType).toBe(AuthType.GOOGLE)
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com', authType: AuthType.GOOGLE },
      })
    })

    it('should return USER_NOT_FOUND when user does not exist with given email and auth type', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.getUserByEmailAndAuthType({
        email: 'test@example.com',
        authType: AuthType.GOOGLE,
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
      expect(result).not.toHaveProperty('user')
    })

    it('should return USER_NOT_FOUND when user exists with different auth type', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const result = await userService.getUserByEmailAndAuthType({
        email: 'test@example.com',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND)
    })
  })

  describe('Caching behavior', () => {
    it('should cache user data after getUserById', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        password: 'hashed_password',
        authType: AuthType.USER_PASSWORD,
        emailVerified: false,
        phoneNumber: null,
        phoneVerified: false,
        notifications: false,
        profilePictureFileName: null,
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      const { cache } = require('../../src/services/cache')

      const result = await userService.getUserById({ userId: 'uuid-1' })

      expect(result.code).toBe(ResponseCode.OK)
      expect(cache.set).toHaveBeenCalledWith('user:uuid-1', user, 300)
    })

    it('should return cached user data on subsequent calls', async () => {
      const cachedUser = {
        id: 'uuid-1',
        email: 'cached@example.com',
        authType: AuthType.USER_PASSWORD,
      }

      const { cache } = require('../../src/services/cache')
      cache.get.mockResolvedValue(cachedUser)

      const result = await userService.getUserById({ userId: 'uuid-1' })

      expect(result.code).toBe(ResponseCode.OK)
      expect((result as any).user).toEqual(cachedUser)
      expect(cache.get).toHaveBeenCalledWith('user:uuid-1')
      expect(mockPrismaClient.user.findUnique).not.toHaveBeenCalled()
    })

    it('should invalidate cache when updating user', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
        notifications: false,
      }

      const updatedUser = { ...user, notifications: true }
      const { cache } = require('../../src/services/cache')

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const result = await userService.toggleNotifications({ userId: 'uuid-1' })

      expect(result.code).toBe(ResponseCode.OK)
      expect(cache.del).toHaveBeenCalledWith('user:uuid-1')
    })

    it('should invalidate cache when updating password', async () => {
      const user = {
        id: 'uuid-1',
        email: 'test@example.com',
      }

      const { cache } = require('../../src/services/cache')

      mockPrismaClient.user.findUnique.mockResolvedValue(user)
      mockPrismaClient.user.update.mockResolvedValue({ ...user, password: 'new_hashed' })

      const result = await userService.updatePassword({
        userId: 'uuid-1',
        password: 'newpassword123',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(cache.del).toHaveBeenCalledWith('user:uuid-1')
    })
  })

  describe('Database error handling', () => {
    it('should handle database errors during user creation', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('../../src/services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500001)
      
      mockPrismaClient.user.create.mockRejectedValue(new Error('Database connection failed'))

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        authType: AuthType.USER_PASSWORD,
      })

      expect(result.code).toBe(500001)
    })

    it('should handle database errors during user lookup', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('../../src/services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500002)
      
      // Mock cache miss to trigger database call
      const { cache } = require('../../src/services/cache')
      cache.get.mockResolvedValue(null)
      
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database timeout'))

      const result = await userService.getUserById({ userId: 'uuid-1' })

      expect(result.code).toBe(500002)
    })

    it('should handle database errors during user update', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('../../src/services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500003)
      
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        notifications: false,
      })
      mockPrismaClient.user.update.mockRejectedValue(new Error('Update failed'))

      const result = await userService.toggleNotifications({ userId: 'uuid-1' })

      expect(result.code).toBe(500003)
    })
  })
})
