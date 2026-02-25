import { NextFunction, Request, RequestHandler, Response } from 'express'
import { container } from 'tsyringe'
import config from '@core/config'
import { getResponseMessage, ResponseCode } from '@common'
import { UserService } from '@api/user/userService'
import { TokenType, verifyToken } from '@services/jsonwebtoken'

interface DecodedToken {
  sub: string
  exp: number
  iat: number
}

const authenticatedDocUsers: { [key: string]: string } = {
  [config.DOCS_USER]: config.DOCS_PASSWORD,
}

const userService = container.resolve(UserService)

export const authenticateDocs = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('Authorization')

  if (authHeader) {
    try {
      const parts = authHeader.split(' ')
      if (parts.length !== 2 || parts[0] !== 'Basic') {
        throw new Error('Invalid Authorization header format')
      }

      const encodedCredentials = parts[1]
      const decodedCredentials = Buffer.from(
        encodedCredentials,
        'base64'
      ).toString()

      const colonIndex = decodedCredentials.indexOf(':')
      if (colonIndex === -1) {
        throw new Error('Invalid credentials format')
      }

      const username = decodedCredentials.substring(0, colonIndex)
      const password = decodedCredentials.substring(colonIndex + 1)

      if (authenticatedDocUsers[username] === password) {
        return next()
      }
    } catch {
      // Invalid auth header format, fall through to 401
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Authentication Required"')
  res.status(401).send('Authentication required')
}

export const requireToken =
  (allowedRoles?: string[]): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let token = ''
      if (req.cookies && req.cookies['accessToken']) {
        token = req.cookies['accessToken']
      } else if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.slice(7)
      }

      const decodedToken = verifyToken<DecodedToken>(
        token,
        TokenType.ACCESS_TOKEN
      )

      if (!decodedToken || !decodedToken.sub) {
        return next({
          code: ResponseCode.INVALID_TOKEN,
          message: getResponseMessage(ResponseCode.INVALID_TOKEN),
        })
      }

      const { user } = await userService.getUserById({
        userId: decodedToken.sub,
      })

      if (!user) {
        return next({
          code: ResponseCode.INVALID_TOKEN,
          message: getResponseMessage(ResponseCode.INVALID_TOKEN),
        })
      }

      const userRoles = user.roles.map(role => role.role.name)

      if (allowedRoles && allowedRoles.length > 0) {
        if (userRoles.includes('SUPERADMIN')) {
          return next()
        }

        const hasAllowedRole = userRoles.some(role =>
          allowedRoles.includes(role)
        )
        if (!hasAllowedRole) {
          return next({
            code: ResponseCode.UNAUTHORIZED,
          })
        }
      }

      req.user = { ...user }

      return next()
    } catch {
      return next({
        code: ResponseCode.INVALID_TOKEN,
        message: getResponseMessage(ResponseCode.INVALID_TOKEN),
      })
    }
  }
