import { NextFunction, Request, RequestHandler, Response } from 'express'
import { container } from 'tsyringe'
import config from 'core/config'
import { getResponseMessage, ResponseCode } from '@common'
import { UserService } from '@api/user/userService'
import { TokenType, verifyToken } from '@services/jsonwebtoken'
import { logger } from '@core/logger'


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
    const encodedCredentials = authHeader.split(' ')[1]
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      'base64'
    ).toString()
    const [username, password] = decodedCredentials.split(':')

    if (authenticatedDocUsers[username] === password) {
      return next()
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
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1]
      } else {
        return next({
          code: ResponseCode.AUTH_HEADER_MISSING
        })
      }

      const decodedToken = verifyToken<{
        sub: string
        tokenVersion?: number
      }>(token, TokenType.ACCESS_TOKEN)
      if (!decodedToken || !decodedToken.sub) {
        return next({ code: ResponseCode.INVALID_ACCESS_TOKEN })
      }

      const { user } = await userService.getUserById({ userId: decodedToken.sub })

      if (!user) {
        return next({
          code: ResponseCode.INVALID_ACCESS_TOKEN
        })
      }

      if (
        decodedToken.tokenVersion === undefined ||
        user.tokenVersion !== decodedToken.tokenVersion
      ) {
        return next({
          code: ResponseCode.SESSION_REVOKED
        })
      }

      if (allowedRoles && allowedRoles.length > 0) {
        if (user.role !== 'SUPERADMIN') {
          if (!user.role || !allowedRoles.includes(user.role)) {
            return next({
              code: ResponseCode.UNAUTHORIZED
            })
          }
        }
      }

      req.user = user

      return next()
    } catch (err) {
      logger.error({
        code: ResponseCode.SERVER_ERROR,
        message: getResponseMessage(ResponseCode.SERVER_ERROR),
        stack: err instanceof Error ? err.stack : undefined
      })
      return next({
        code: ResponseCode.SERVER_ERROR
      })
    }
  }