import 'reflect-metadata'
import { ResponseError, ResponseCode, getResponseMessage } from '../../src/common/response'

describe('Response Utilities', () => {
  describe('ResponseError', () => {
    it('should create ResponseError with correct message and code', () => {
      const error = new ResponseError(ResponseCode.USER_NOT_FOUND)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ResponseError)
      expect(error.code).toBe(ResponseCode.USER_NOT_FOUND)
      expect(error.message).toBe('User not found')
    })

    it('should create ResponseError with server error message', () => {
      const error = new ResponseError(ResponseCode.SERVER_ERROR)

      expect(error.code).toBe(ResponseCode.SERVER_ERROR)
      expect(error.message).toBe('Internal server error')
    })

    it('should have correct stack trace', () => {
      const error = new ResponseError(ResponseCode.INVALID_INPUT)

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('ResponseError')
    })
  })

  describe('getResponseMessage', () => {
    it('should return correct message for valid response code', () => {
      const message = getResponseMessage(ResponseCode.OK)
      expect(message).toBe('Success')
    })

    it('should return server error message for invalid code', () => {
      const message = getResponseMessage(999999 as any)
      expect(message).toBe('Internal server error')
    })

    it('should return message for user not found', () => {
      const message = getResponseMessage(ResponseCode.USER_NOT_FOUND)
      expect(message).toBe('User not found')
    })

    it('should return message for invalid input', () => {
      const message = getResponseMessage(ResponseCode.INVALID_INPUT)
      expect(message).toBe('Invalid input provided')
    })
  })
})
