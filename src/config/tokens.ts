import { CookieOptions } from 'express'
import config from '.'

/*
  These options are intended for when cookies are used for authentication
*/

export const getAccessCookieOptions = () => {
  const accessExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN

  const accessCookieOptions: CookieOptions = {
    expires: new Date(Date.now() + Number(accessExpiresIn) * 60 * 1000),
    maxAge: Number(accessExpiresIn) * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }

  return accessCookieOptions
}

export const getRefreshCookieOptions = () => {
  const refreshExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN

  const refreshCookieOptions: CookieOptions = {
    expires: new Date(Date.now() + Number(refreshExpiresIn) * 60 * 1000),
    maxAge: Number(refreshExpiresIn) * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict'
  }

  return refreshCookieOptions
}
