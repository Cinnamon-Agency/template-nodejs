import { sign, SignOptions, verify } from 'jsonwebtoken'
import config from '../../config'

export enum KeyType {
  ACCESS_TOKEN_PRIVATE_KEY = 'ACCESS_TOKEN_PRIVATE_KEY',
  REFRESH_TOKEN_PRIVATE_KEY = 'REFRESH_TOKEN_PRIVATE_KEY'
}

export const generateToken = (
  payload: Object,
  key: KeyType,
  options: SignOptions = {}
): string => {
  const privateKey = Buffer.from(config[key], 'base64').toString('ascii')

  const token = sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256'
  })

  return token
}

export const verifyToken = <T>(token: string, key: KeyType): T | undefined => {
  try {
    const publicKey = Buffer.from(config[key], 'base64').toString('ascii')
    
    return verify(token, publicKey) as T
  } catch (err) {
    return
  }
}
