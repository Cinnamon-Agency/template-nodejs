import { StatusCode, ResponseCode, ResponseMessage } from '../../interfaces'
import { NextFunction, Request, Response } from 'express'
import { UserService } from '../../api/user/userService'
import { KeyType, verifyToken } from '../../services/jsonwebtoken'
import _ from 'lodash'
import { logger } from '../../logger'
import config from '../../config'

const authenticatedDocUsers: { [key: string]: string } = {
  [config.DOCS_USER]: config.DOCS_PASSWORD
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
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token
    }

    const decodedToken = await verifyToken<any>(
      token,
      KeyType.ACCESS_TOKEN_PRIVATE_KEY
    )
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

    const { user } = await new UserService().getUserById({
      userId: decodedToken.sub
    })
    if (!user) {
      return res.status(StatusCode.UNAUTHORIZED).send({
        data: null,
        code: ResponseCode.INVALID_TOKEN,
        message: ResponseMessage.INVALID_TOKEN
      })
    }

    const requestUser = _.omit(user, ['password', 'createdAt', 'updatedAt'])

    req.user = requestUser

    logger.defaultMeta = {
      ...logger.defaultMeta,
      user_id: requestUser.id || 'null'
    }

    return next()
  } catch (e: any) {
    return res.status(StatusCode.UNAUTHORIZED).send({
      data: null,
      code: ResponseCode.INVALID_TOKEN,
      message: ResponseMessage.INVALID_TOKEN
    })
  }
}

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
