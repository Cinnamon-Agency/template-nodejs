import 'reflect-metadata'
import { Request, Response } from 'express'
import '../../src/common/types' // global augmentation for req.requestId
import { ResponseCode } from '../../src/common/response'
import { sanitizeInput } from '../../src/middleware/sanitize'
import { requestIdMiddleware } from '../../src/middleware/request_id'
import { notFound } from '../../src/middleware/not_found'
import { shutdownHandler } from '../../src/middleware/shutdown'
import { ServerState } from '../../src/core/server/state'
import { sanitizeUser } from '../../src/common/dto'

// ── helpers ──────────────────────────────────────────────────

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    cookies: {},
    headers: {},
    method: 'GET',
    url: '/',
    originalUrl: '/',
    path: '/',
    get: jest.fn(),
    ...overrides,
  } as unknown as Request
}

function mockRes(): Response {
  const res: Partial<Response> = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    locals: {},
  }
  return res as Response
}

// ── sanitizeInput ────────────────────────────────────────────

describe('sanitizeInput middleware', () => {
  it('should trim string values in body', () => {
    const req = mockReq({ body: { name: '  hello  ', age: 25 } })
    const res = mockRes()
    const next = jest.fn()

    sanitizeInput(req, res, next)

    expect(req.body.name).toBe('hello')
    expect(req.body.age).toBe(25)
    expect(next).toHaveBeenCalled()
  })

  it('should lowercase email field', () => {
    const req = mockReq({ body: { email: '  John@Example.COM  ' } })
    const res = mockRes()
    const next = jest.fn()

    sanitizeInput(req, res, next)

    expect(req.body.email).toBe('john@example.com')
    expect(next).toHaveBeenCalled()
  })

  it('should handle empty body gracefully', () => {
    const req = mockReq({ body: undefined })
    const res = mockRes()
    const next = jest.fn()

    sanitizeInput(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should handle non-object body gracefully', () => {
    const req = mockReq({ body: 'raw string' as unknown as Record<string, unknown> })
    const res = mockRes()
    const next = jest.fn()

    sanitizeInput(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})

// ── requestIdMiddleware ──────────────────────────────────────

describe('requestIdMiddleware', () => {
  it('should generate a new request ID when none provided', () => {
    const req = mockReq({ headers: {} })
    const res = mockRes()
    const next = jest.fn()

    requestIdMiddleware(req, res, next)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = req as any
    expect(r.requestId).toBeDefined()
    expect(typeof r.requestId).toBe('string')
    expect(r.requestId.length).toBeGreaterThan(0)
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', r.requestId)
    expect(next).toHaveBeenCalled()
  })

  it('should reuse existing x-request-id header', () => {
    const req = mockReq({ headers: { 'x-request-id': 'custom-id-123' } })
    const res = mockRes()
    const next = jest.fn()

    requestIdMiddleware(req, res, next)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((req as any).requestId).toBe('custom-id-123')
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'custom-id-123')
    expect(next).toHaveBeenCalled()
  })
})

// ── notFound ─────────────────────────────────────────────────

describe('notFound middleware', () => {
  it('should call next with NOT_FOUND response code', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()

    notFound(req, res, next)

    expect(next).toHaveBeenCalledWith({ code: ResponseCode.NOT_FOUND })
  })
})

// ── shutdownHandler ──────────────────────────────────────────

describe('shutdownHandler middleware', () => {
  it('should pass through when server is not shutting down', () => {
    const state = new ServerState()
    const middleware = shutdownHandler(state)
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should return APP_SHUTTING_DOWN when server is shutting down', () => {
    const state = new ServerState()
    state.shuttingDown = true
    const middleware = shutdownHandler(state)
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith({ code: ResponseCode.APP_SHUTTING_DOWN })
  })
})

// ── sanitizeUser DTO ─────────────────────────────────────────

describe('sanitizeUser DTO', () => {
  it('should strip password from user object', () => {
    const user = {
      id: '123',
      email: 'test@test.com',
      password: 'secret-hash',
      emailVerified: true,
      phoneNumber: null,
      phoneVerified: false,
      authType: 'USER_PASSWORD',
      notifications: false,
      profilePictureFileName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = sanitizeUser(user as any)

    expect(result).not.toHaveProperty('password')
    expect(result.id).toBe('123')
    expect(result.email).toBe('test@test.com')
  })

  it('should work when password is null', () => {
    const user = {
      id: '456',
      email: 'oauth@test.com',
      password: null,
      emailVerified: false,
      phoneNumber: null,
      phoneVerified: false,
      authType: 'GOOGLE',
      notifications: false,
      profilePictureFileName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = sanitizeUser(user as any)

    expect(result).not.toHaveProperty('password')
    expect(result.id).toBe('456')
  })
})
