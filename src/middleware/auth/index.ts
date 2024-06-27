import { NextFunction, Request, Response } from 'express'
import config from '../../config'
import {
  ResponseCode,
  ResponseMessage,
  StatusCode
} from '../../interface/response'
import { container } from 'tsyringe'
import { UserService } from '../../api/user/userService'
import { TokenType, verifyToken } from '../../services/jsonwebtoken'

const authenticatedDocUsers: { [key: string]: string } = {
  [config.DOCS_USER]: config.DOCS_PASSWORD
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

export const requireToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = ''
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    const decodedToken = await verifyToken<any>(token, TokenType.ACCESS_TOKEN)
    if (
      !decodedToken ||
      typeof decodedToken.payload === 'string' ||
      !decodedToken.sub
    ) {
      return res.status(StatusCode.UNAUTHORIZED).send({
        data: null,
        code: ResponseCode.INVALID_TOKEN,
        message: ResponseMessage.INVALID_TOKEN
      })
    }

    const { user } = await userService.getUserById({
      userId: decodedToken.sub
    })

    if (!user) {
      return res.status(StatusCode.UNAUTHORIZED).send({
        data: null,
        code: ResponseCode.INVALID_TOKEN,
        message: ResponseMessage.INVALID_TOKEN
      })
    }

    req.user = { ...user }

    return next()
  } catch (e: unknown) {
    return res.status(StatusCode.UNAUTHORIZED).send({
      data: null,
      code: ResponseCode.INVALID_TOKEN,
      message: ResponseMessage.INVALID_TOKEN
    })
  }
}
