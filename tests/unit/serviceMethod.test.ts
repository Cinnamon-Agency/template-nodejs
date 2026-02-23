import 'reflect-metadata'
import { serviceMethod, ErrorContext } from '../../src/common/decorators/serviceMethod'
import { ResponseCode, ResponseError } from '../../src/common/response'

// Mock dependencies
jest.mock('@core/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('@services/prisma', () => ({
  isPrismaError: jest.fn(() => false),
  mapPrismaErrorToResponseCode: jest.fn(() => 500000),
}))

jest.mock('@common/response', () => ({
  ResponseCode: {
    OK: 200000,
    SERVER_ERROR: 500000,
    USER_NOT_FOUND: 404000,
    INVALID_INPUT: 400000,
  },
  ResponseError: class ResponseError extends Error {
    constructor(public code: number) {
      super(`ResponseError: ${code}`)
    }
  },
  getResponseMessage: jest.fn((code) => `Error message for ${code}`),
}))

describe('serviceMethod decorator', () => {
  let mockLogger: any
  let mockIsPrismaError: any
  let mockMapPrismaErrorToResponseCode: any
  let mockGetResponseMessage: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger = require('@core/logger').logger
    mockIsPrismaError = require('@services/prisma').isPrismaError
    mockMapPrismaErrorToResponseCode = require('@services/prisma').mapPrismaErrorToResponseCode
    mockGetResponseMessage = require('@common/response').getResponseMessage
  })

  describe('Basic functionality', () => {
    it('should execute method successfully and return result', async () => {
      class TestService {
        @serviceMethod()
        async testMethod(input: { value: string }) {
          return { result: `processed: ${input.value}`, code: ResponseCode.OK }
        }
      }

      const service = new TestService()
      const result = await service.testMethod({ value: 'test' })

      expect(result).toEqual({
        result: 'processed: test',
        code: ResponseCode.OK,
      })
    })

    it('should add errorContext to parameters when object provided', async () => {
      class TestService {
        @serviceMethod()
        async testMethod(input: { value: string; errorContext?: ErrorContext }) {
          return { 
            hasErrorContext: !!input.errorContext,
            code: ResponseCode.OK 
          }
        }
      }

      const service = new TestService()
      const result = await service.testMethod({ value: 'test' })

      expect(result.hasErrorContext).toBe(true)
      expect(result.code).toBe(ResponseCode.OK)
    })

    it('should not modify parameters when no object provided', async () => {
      class TestService {
        @serviceMethod()
        async testMethod(value: string) {
          return { result: value, code: ResponseCode.OK }
        }
      }

      const service = new TestService()
      const result = await service.testMethod('test')

      expect(result).toEqual({ result: 'test', code: ResponseCode.OK })
    })
  })

  describe('Error handling', () => {
    it('should handle ResponseError and return code', async () => {
      class TestService {
        @serviceMethod()
        async testMethod() {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
    })

    it('should handle generic Error and return SERVER_ERROR', async () => {
      class TestService {
        @serviceMethod()
        async testMethod() {
          throw new Error('Generic error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: ResponseCode.SERVER_ERROR })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error message for 500000',
        errorMessage: 'Generic error',
        originalError: expect.any(Error),
        stack: expect.any(String),
      })
    })

    it('should handle string errors and return SERVER_ERROR', async () => {
      class TestService {
        @serviceMethod()
        async testMethod() {
          throw 'String error'
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: ResponseCode.SERVER_ERROR })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error message for 500000',
        errorMessage: 'String error',
        originalError: 'String error',
        stack: undefined,
      })
    })

    it('should handle Prisma errors', async () => {
      const prismaError = new Error('Prisma error') as any
      prismaError.code = 'P2002'
      prismaError.meta = { target: 'email' }

      mockIsPrismaError.mockReturnValue(true)
      mockMapPrismaErrorToResponseCode.mockReturnValue(400000)

      class TestService {
        @serviceMethod()
        async testMethod() {
          throw prismaError
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: 400000 })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: 400000,
        message: 'Error message for 400000',
        prismaCode: 'P2002',
        prismaMessage: 'Prisma error',
        meta: { target: 'email' },
        originalError: prismaError,
        stack: expect.any(String),
      })
    })
  })

  describe('Custom error handlers', () => {
    it('should use custom error handler for ResponseError', async () => {
      const customErrorHandler = jest.fn().mockResolvedValue({
        code: ResponseCode.INVALID_INPUT,
        message: 'Custom error message',
      })

      class TestService {
        @serviceMethod({ onError: customErrorHandler })
        async testMethod() {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.any(ResponseError),
        expect.any(Object)
      )
      expect(result).toEqual({
        code: ResponseCode.INVALID_INPUT,
        message: 'Custom error message',
      })
    })

    it('should use custom error handler for generic errors', async () => {
      const customErrorHandler = jest.fn().mockResolvedValue({
        code: ResponseCode.INVALID_INPUT,
        message: 'Custom error message',
      })

      class TestService {
        @serviceMethod({ onError: customErrorHandler })
        async testMethod() {
          throw new Error('Generic error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      )
      expect(result).toEqual({
        code: ResponseCode.INVALID_INPUT,
        message: 'Custom error message',
      })
    })

    it('should fall back to default behavior when custom handler returns undefined', async () => {
      const customErrorHandler = jest.fn().mockResolvedValue(undefined)

      class TestService {
        @serviceMethod({ onError: customErrorHandler })
        async testMethod() {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(customErrorHandler).toHaveBeenCalled()
      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
    })

    it('should handle errors in custom error handler for ResponseError', async () => {
      const customErrorHandler = jest.fn().mockRejectedValue(new Error('Handler error'))

      class TestService {
        @serviceMethod({ onError: customErrorHandler })
        async testMethod() {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception during cleanup',
        originalError: expect.any(String),
        handlerError: 'Handler error',
        stack: expect.any(String),
      })
    })

    it('should handle errors in custom error handler for generic errors', async () => {
      const customErrorHandler = jest.fn().mockRejectedValue(new Error('Handler error'))

      class TestService {
        @serviceMethod({ onError: customErrorHandler })
        async testMethod() {
          throw new Error('Generic error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: ResponseCode.SERVER_ERROR })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception',
        originalError: 'Generic error',
        handlerError: 'Handler error',
        stack: expect.any(String),
      })
    })
  })

  describe('throwOnError functionality', () => {
    it('should throw when throwOnError is true and result code is not OK', async () => {
      class TestService {
        @serviceMethod()
        async testMethod(input: { throwOnError?: boolean }) {
          return { code: ResponseCode.USER_NOT_FOUND }
        }
      }

      const service = new TestService()
      const result = await service.testMethod({ throwOnError: true })

      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
    })

    it('should not throw when throwOnError is false', async () => {
      class TestService {
        @serviceMethod()
        async testMethod(input: { throwOnError?: boolean }) {
          return { code: ResponseCode.USER_NOT_FOUND }
        }
      }

      const service = new TestService()
      const result = await service.testMethod({ throwOnError: false })

      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
    })

    it('should not throw when throwOnError is true but result code is OK', async () => {
      class TestService {
        @serviceMethod()
        async testMethod(input: { throwOnError?: boolean }) {
          return { code: ResponseCode.OK, data: 'success' }
        }
      }

      const service = new TestService()
      const result = await service.testMethod({ throwOnError: true })

      expect(result).toEqual({ code: ResponseCode.OK, data: 'success' })
    })
  })

  describe('Error context', () => {
    it('should pass error context to custom error handler', async () => {
      const customErrorHandler = jest.fn().mockResolvedValue({
        code: ResponseCode.INVALID_INPUT,
      })

      class TestService {
        @serviceMethod({ onError: customErrorHandler })
        async testMethod(input: { userId: string; errorContext?: ErrorContext }) {
          input.errorContext!.userId = input.userId
          throw new Error('Test error')
        }
      }

      const service = new TestService()
      await service.testMethod({ userId: 'user-123' })

      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        { userId: 'user-123' }
      )
    })
  })

  describe('Method preservation', () => {
    it('should preserve method name and descriptor properties', async () => {
      class TestService {
        @serviceMethod()
        async testMethod() {
          return { code: ResponseCode.OK }
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        TestService.prototype,
        'testMethod'
      )

      expect(descriptor).toBeDefined()
      expect(descriptor!.value).toBeInstanceOf(Function)
      expect(descriptor!.enumerable).toBe(false)
      expect(descriptor!.configurable).toBe(true)
    })
  })

  describe('Error handler exception handling', () => {
    it('should handle ResponseError with throwing error handler', async () => {
      const throwingErrorHandler = jest.fn().mockImplementation(async () => {
        throw new Error('Handler error')
      })

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result?.code).toBe(ResponseCode.USER_NOT_FOUND)
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception during cleanup',
        originalError: expect.any(String),
        handlerError: 'Handler error',
        stack: expect.any(String),
      })
    })

    it('should handle general error with throwing error handler', async () => {
      const throwingErrorHandler = jest.fn().mockImplementation(async () => {
        throw new Error('Handler error')
      })

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new Error('General error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result?.code).toBe(ResponseCode.SERVER_ERROR)
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception',
        originalError: 'General error',
        handlerError: 'Handler error',
        stack: expect.any(String),
      })
    })

    it('should handle error handler that throws non-Error object', async () => {
      const throwingErrorHandler = jest.fn().mockImplementation(async () => {
        throw 'String error'
      })

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new Error('General error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result?.code).toBe(ResponseCode.SERVER_ERROR)
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception',
        originalError: 'General error',
        handlerError: 'String error',
        stack: undefined,
      })
    })
  })

  describe('Error handler with non-Error objects', () => {
    it('should handle string handlerError in ResponseError case', async () => {
      const throwingErrorHandler = jest.fn().mockRejectedValue('String error')

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      // For ResponseError, even if handler throws, it returns original error code
      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception during cleanup',
        originalError: expect.any(String),
        handlerError: 'String error',
        stack: undefined,
      })
    })

    it('should handle object handlerError in ResponseError case', async () => {
      const throwingErrorHandler = jest.fn().mockRejectedValue({ message: 'Object error' })

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new ResponseError(ResponseCode.USER_NOT_FOUND)
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      // For ResponseError, even if handler throws, it returns original error code
      expect(result).toEqual({ code: ResponseCode.USER_NOT_FOUND })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception during cleanup',
        originalError: expect.any(String),
        handlerError: '[object Object]',
        stack: undefined,
      })
    })

    it('should handle string handlerError in general error case', async () => {
      const throwingErrorHandler = jest.fn().mockRejectedValue('String error')

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new Error('General error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      // For general errors, when handler throws, it returns SERVER_ERROR code only
      expect(result).toEqual({ code: ResponseCode.SERVER_ERROR })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception',
        originalError: 'General error',
        handlerError: 'String error',
        stack: undefined,
      })
    })

    it('should handle null handlerError', async () => {
      const throwingErrorHandler = jest.fn().mockRejectedValue(null)

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new Error('General error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      // For general errors, when handler throws, it returns SERVER_ERROR code only
      expect(result).toEqual({ code: ResponseCode.SERVER_ERROR })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception',
        originalError: 'General error',
        handlerError: 'null',
        stack: undefined,
      })
    })

    it('should handle error handler that returns response without code', async () => {
      const invalidErrorHandler = jest.fn().mockResolvedValue({ invalidField: 'value' })

      class TestService {
        @serviceMethod({ onError: invalidErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw new Error('General error')
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      // Should fall back to INVALID_INPUT when error handler returns invalid response
      expect(result).toEqual({ code: ResponseCode.INVALID_INPUT })
    })

    it('should handle non-Error originalError in error handler exception', async () => {
      const throwingErrorHandler = jest.fn().mockRejectedValue(new Error('Handler error'))

      class TestService {
        @serviceMethod({ onError: throwingErrorHandler })
        async testMethod(): Promise<{ code: ResponseCode }> {
          throw 'String error' // Not an Error object
        }
      }

      const service = new TestService()
      const result = await service.testMethod()

      expect(result).toEqual({ code: ResponseCode.SERVER_ERROR })
      expect(mockLogger.error).toHaveBeenCalledWith({
        code: ResponseCode.SERVER_ERROR,
        message: 'Error handler threw an exception',
        originalError: 'String error',
        handlerError: 'Handler error',
        stack: expect.any(String),
      })
    })
  })
})
