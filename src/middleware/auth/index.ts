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
      if (req.cookies && req.cookies['template-token']) {
        token = req.cookies['template-token']
      }

      const decodedToken = await verifyToken<any>(token, TokenType.ACCESS_TOKEN)
      if (
        !decodedToken ||
        typeof decodedToken.payload === 'string' ||
        !decodedToken.sub
      ) {
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

        if (!allowedRoles.includes(userRoles[0])) {
          return next({
            code: ResponseCode.UNAUTHORIZED,
          })
        }
      }

      req.user = { ...user }

      return next()
    } catch (e: unknown) {
      return next({
        code: ResponseCode.INVALID_TOKEN,
        message: getResponseMessage(ResponseCode.INVALID_TOKEN),
      })
    }
  }
