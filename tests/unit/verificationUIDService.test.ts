import 'reflect-metadata'
import { VerificationUIDService } from '../../src/api/verification_uid/verificationUIDService'
import { ResponseCode } from '../../src/common/response'

// Mock dependencies
const mockPrismaClient = {
  verificationUID: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@services/prisma', () => ({
  getPrismaClient: () => mockPrismaClient,
  isPrismaError: jest.fn(() => false),
  mapPrismaErrorToResponseCode: jest.fn(() => 500000),
}))

jest.mock('@services/bcrypt', () => ({
  hashString: jest.fn().mockResolvedValue('hashed_uid'),
  compare: jest.fn().mockResolvedValue(true),
}))

jest.mock('@services/uuid', () => ({
  generateUUID: jest.fn(() => {
    const calls = require('@services/uuid').generateUUID.mock.calls
    const callCount = calls.length
    if (callCount === 1 || callCount === 3) return 'uid-123'
    if (callCount === 2 || callCount === 4) return 'hash-uid-123'
    return `uuid-${callCount}`
  }),
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
}))

jest.mock('@core/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe('VerificationUIDService', () => {
  let verificationUIDService: VerificationUIDService

  beforeEach(() => {
    jest.clearAllMocks()
    verificationUIDService = new VerificationUIDService()
  })

  describe('setVerificationUID', () => {
    it('should set verification UID successfully', async () => {
      const mockCreated = { id: 'verification-123', userId: 'user-123', uid: 'uid-123' }

      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(null)
      mockPrismaClient.verificationUID.delete.mockResolvedValue({})
      mockPrismaClient.verificationUID.create.mockResolvedValue(mockCreated)

      const result = await verificationUIDService.setVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.uids).toEqual({
        uid: 'uid-123',
        hashUID: 'hash-uid-123',
      })
      expect(mockPrismaClient.verificationUID.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          uid: 'uid-123',
          hash: 'hashed_uid',
          type: 'EMAIL_VERIFICATION',
        },
      })
    })

    it('should clear existing verification UID before creating new one', async () => {
      const mockExisting = { id: 'existing-123', userId: 'user-123' }
      const mockCreated = { id: 'verification-123', userId: 'user-123', uid: 'uid-123' }

      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockExisting)
      mockPrismaClient.verificationUID.delete.mockResolvedValue(mockExisting)
      mockPrismaClient.verificationUID.create.mockResolvedValue(mockCreated)

      const result = await verificationUIDService.setVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.verificationUID.delete).toHaveBeenCalledWith({
        where: { id: 'existing-123' },
      })
    })

    it('should return FAILED_INSERT when creation fails', async () => {
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(null)
      mockPrismaClient.verificationUID.delete.mockResolvedValue({})
      mockPrismaClient.verificationUID.create.mockResolvedValue(null)

      const result = await verificationUIDService.setVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.FAILED_INSERT)
    })
  })

  describe('getVerificationUID', () => {
    it('should return verification UID when found', async () => {
      const mockVerificationUID = {
        id: 'verification-123',
        userId: 'user-123',
        uid: 'uid-123',
        hash: 'hashed_uid',
        type: 'EMAIL_VERIFICATION',
      }

      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockVerificationUID)

      const result = await verificationUIDService.getVerificationUID({ uid: 'uid-123' })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.verificationUID).toEqual(mockVerificationUID)
    })

    it('should return INVALID_UID when verification UID not found', async () => {
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(null)

      const result = await verificationUIDService.getVerificationUID({ uid: 'nonexistent-uid' })

      expect(result.code).toBe(ResponseCode.INVALID_UID)
      expect(result).not.toHaveProperty('verificationUID')
    })
  })

  describe('clearVerificationUID', () => {
    it('should clear verification UID successfully', async () => {
      const mockVerificationUID = {
        id: 'verification-123',
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      }

      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockVerificationUID)
      mockPrismaClient.verificationUID.delete.mockResolvedValue(mockVerificationUID)

      const result = await verificationUIDService.clearVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(mockPrismaClient.verificationUID.delete).toHaveBeenCalledWith({
        where: { id: 'verification-123' },
      })
    })

    it('should return VERIFICATION_UID_NOT_FOUND when verification UID does not exist', async () => {
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(null)

      const result = await verificationUIDService.clearVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.VERIFICATION_UID_NOT_FOUND)
      expect(mockPrismaClient.verificationUID.delete).not.toHaveBeenCalled()
    })
  })

  describe('verifyUID', () => {
    it('should verify UID successfully', async () => {
      const mockVerificationUID = {
        id: 'verification-123',
        userId: 'user-123',
        uid: 'uid-123',
        hash: 'hashed_uid',
        type: 'EMAIL_VERIFICATION',
      }

      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockVerificationUID)

      const result = await verificationUIDService.verifyUID({
        uid: 'uid-123',
        hashUid: 'hash-uid-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.OK)
      expect(result.verificationUID).toEqual(mockVerificationUID)
    })

    it('should return VERIFICATION_UID_NOT_FOUND when UID not found', async () => {
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(null)

      const result = await verificationUIDService.verifyUID({
        uid: 'nonexistent-uid',
        hashUid: 'hash-uid-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.VERIFICATION_UID_NOT_FOUND)
    })

    it('should return INVALID_UID when hash does not match', async () => {
      const mockVerificationUID = {
        id: 'verification-123',
        userId: 'user-123',
        uid: 'uid-123',
        hash: 'hashed_uid',
        type: 'EMAIL_VERIFICATION',
      }

      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockVerificationUID)
      const { compare } = require('@services/bcrypt')
      compare.mockResolvedValue(false)

      const result = await verificationUIDService.verifyUID({
        uid: 'uid-123',
        hashUid: 'wrong-hash-uid',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(ResponseCode.INVALID_UID)
    })
  })

  describe('Database error handling', () => {
    it('should handle database errors during UID creation', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('@services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500001)
      
      mockPrismaClient.verificationUID.findFirst.mockRejectedValue(new Error('Database connection failed'))

      const result = await verificationUIDService.setVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(500001)
    })

    it('should handle database errors during UID lookup', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('@services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500002)
      
      mockPrismaClient.verificationUID.findFirst.mockRejectedValue(new Error('Database timeout'))

      const result = await verificationUIDService.getVerificationUID({ uid: 'uid-123' })

      expect(result.code).toBe(500002)
    })

    it('should handle database errors during UID verification', async () => {
      const { isPrismaError, mapPrismaErrorToResponseCode } = require('@services/prisma')
      isPrismaError.mockReturnValue(true)
      mapPrismaErrorToResponseCode.mockReturnValue(500003)
      
      mockPrismaClient.verificationUID.findFirst.mockRejectedValue(new Error('Database error'))

      const result = await verificationUIDService.verifyUID({
        uid: 'uid-123',
        hashUid: 'hash-uid-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(result.code).toBe(500003)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete verification flow', async () => {
      // Reset UUID mock to ensure predictable values
      const { generateUUID } = require('@services/uuid')
      generateUUID.mockClear()
      
      // Set verification UID
      const mockCreated = { id: 'verification-123', userId: 'user-123', uid: 'uid-123' }
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(null)
      mockPrismaClient.verificationUID.delete.mockResolvedValue({})
      mockPrismaClient.verificationUID.create.mockResolvedValue(mockCreated)

      const setResult = await verificationUIDService.setVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(setResult.code).toBe(ResponseCode.OK)
      expect(setResult.uids).toEqual({
        uid: 'uid-123',
        hashUID: 'hash-uid-123',
      })

      // Verify UID - reset mock to ensure it returns the verification data
      const mockVerificationUID = {
        id: 'verification-123',
        userId: 'user-123',
        uid: 'uid-123',
        hash: 'hashed_uid',
        type: 'EMAIL_VERIFICATION',
      }
      
      // Reset and properly configure the mocks
      mockPrismaClient.verificationUID.findFirst.mockReset()
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockVerificationUID)
      
      // Ensure bcrypt compare returns true for this test
      const { compare } = require('@services/bcrypt')
      compare.mockResolvedValue(true)

      const verifyResult = await verificationUIDService.verifyUID({
        uid: 'uid-123',
        hashUid: 'hash-uid-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(verifyResult.code).toBe(ResponseCode.OK)
      expect(verifyResult.verificationUID).toEqual(mockVerificationUID)

      // Clear verification UID
      mockPrismaClient.verificationUID.findFirst.mockResolvedValue(mockVerificationUID)
      mockPrismaClient.verificationUID.delete.mockResolvedValue(mockVerificationUID)

      const clearResult = await verificationUIDService.clearVerificationUID({
        userId: 'user-123',
        type: 'EMAIL_VERIFICATION',
      })

      expect(clearResult.code).toBe(ResponseCode.OK)
    })
  })
})
