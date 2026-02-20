import { NextFunction, Request, Response } from 'express'
import { randomBytes } from 'crypto'
import config from '@core/config'
import { ResponseCode, CSRF_TOKEN_LENGTH } from '@common'

const isProduction = config.NODE_ENV === 'production'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Double-submit cookie CSRF protection.
 *
 * How it works:
 * 1. On every response, a CSRF token is set as a non-httpOnly cookie
 *    so the client-side JavaScript can read it.
 * 2. On state-changing requests (POST, PUT, PATCH, DELETE), the middleware
 *    checks that the `x-csrf-token` header matches the cookie value.
 * 3. An attacker on a different origin cannot read the cookie value,
 *    so they cannot forge the header.
 *
 * Mobile clients (identified by `x-client-type: mobile`) are exempt
 * because they use bearer tokens, not cookies.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF for mobile clients (they use bearer tokens, not cookies)
  if (req.headers['x-client-type'] === 'mobile') {
    return next()
  }

  // Always set/refresh the CSRF cookie so the client has a token to send
  let csrfCookieValue = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined
  if (!csrfCookieValue) {
    csrfCookieValue = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
    res.cookie(CSRF_COOKIE_NAME, csrfCookieValue, {
      httpOnly: false, // Client JS must be able to read this
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    })
  }

  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.has(req.method)) {
    return next()
  }

  // Validate: header token must match cookie token
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined
  if (!headerToken || headerToken !== csrfCookieValue) {
    return next({
      code: ResponseCode.FORBIDDEN,
      message: 'CSRF token mismatch',
    })
  }

  return next()
}
