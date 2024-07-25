import { sign, SignOptions, verify } from 'jsonwebtoken'
import config from '../../config'
export enum TokenType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN'
}
export const generateToken = (
  payload: object,
  type: TokenType,
  options: SignOptions = {}
): string => {
  const secret = config[`${type}_SECRET`]
  const token = sign(payload, secret, {
    expiresIn: `${config[`${type}_EXPIRES_IN`]}m`,
    ...(options && options)
  })
  return token
}
export const verifyToken = <T>(
  token: string,
  type: TokenType
): T | undefined => {
  try {
    const secret = config[`${type}_SECRET`]
    return verify(token, secret) as T
  } catch (err) {
    return
  }
}
