import { getAccessCookieOptions, getRefreshCookieOptions } from './tokens'

/* eslint-disable operator-linebreak */
interface ENV {
  PORT?: number
  API_BASE_URL?: string
  DOCS_BASE_URL?: string
  SALT_ROUNDS?: number
  COOKIE_SECRET?: string
  NODE_ENV?: string
  REFRESH_TOKEN_KEY?: string
  ACCESS_TOKEN_KEY?: string
  RATE_LIMITER_POINTS?: number
  RATE_LIMITER_DURATION_IN_SECONDS?: number
  DOCS_USER?: string
  DOCS_PASSWORD?: string
  LOGIN_LIMITER_POINTS?: number
  LOGIN_LIMITER_DURATION_IN_SECONDS?: number
  LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS?: number
  LOG_TO_CONSOLE?: boolean
  ACCESS_TOKEN_PRIVATE_KEY?: string
  REFRESH_TOKEN_PRIVATE_KEY?: string
  ACCESS_TOKEN_EXPIRES_IN?: number
  REFRESH_TOKEN_EXPIRES_IN?: number
  DB_HOSTNAME?: string
  DB_USERNAME?: string
  DB_PASSWORD?: string
  DB_PORT?: number
  DB_NAME?: string
  STORAGE_BASE_URL?: string
  PROFILE_IMAGE_BASE_URL?: string
  DEFAULT_PROFILE_IMAGE_LOCATION?: string
  DELETED_PROFILE_IMAGE_LOCATION?: string
  EXAMPLE_CHECK_SCHEDULE?: string
  ENABLE_WEB_SOCKET?: boolean
  WEB_SOCKET_PORT?: number
  FILE_UPLOAD_SIZE_LIMIT?: number
  LOG_REQUESTS?: boolean
}

const environmentNumber = (envNum: any): number | undefined => {
  return envNum ? Number(envNum) : undefined
}

const environmentBoolean = (envBool: any): boolean | undefined => {
  return envBool === 'true' || envBool === 'false'
    ? envBool === 'true'
    : undefined
}

const getConfig = (): ENV => {
  return {
    PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
    API_BASE_URL: process.env.API_BASE_URL,
    DOCS_BASE_URL: process.env.DOCS_BASE_URL,
    SALT_ROUNDS: environmentNumber(process.env.SALT_ROUNDS),
    COOKIE_SECRET: process.env.COOKIE_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    REFRESH_TOKEN_KEY: process.env.REFRESH_TOKEN_KEY,
    ACCESS_TOKEN_KEY: process.env.ACCESS_TOKEN_KEY,
    RATE_LIMITER_POINTS: environmentNumber(process.env.RATE_LIMITER_POINTS),
    RATE_LIMITER_DURATION_IN_SECONDS: environmentNumber(
      process.env.RATE_LIMITER_DURATION_IN_SECONDS
    ),
    DOCS_USER: process.env.DOCS_USER,
    DOCS_PASSWORD: process.env.DOCS_PASSWORD,
    LOGIN_LIMITER_POINTS: environmentNumber(process.env.LOGIN_LIMITER_POINTS),
    LOGIN_LIMITER_DURATION_IN_SECONDS: environmentNumber(
      process.env.LOGIN_LIMITER_DURATION_IN_SECONDS
    ),
    LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS: environmentNumber(
      process.env.LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS
    ),
    LOG_TO_CONSOLE: environmentBoolean(process.env.LOG_TO_CONSOLE),
    ACCESS_TOKEN_PRIVATE_KEY: process.env.ACCESS_TOKEN_PRIVATE_KEY,
    REFRESH_TOKEN_PRIVATE_KEY: process.env.REFRESH_TOKEN_PRIVATE_KEY,
    ACCESS_TOKEN_EXPIRES_IN: environmentNumber(
      process.env.ACCESS_TOKEN_EXPIRES_IN
    ),
    REFRESH_TOKEN_EXPIRES_IN: environmentNumber(
      process.env.REFRESH_TOKEN_EXPIRES_IN
    ),
    DB_HOSTNAME: process.env.DB_HOSTNAME,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_PORT: environmentNumber(process.env.DB_PORT),
    DB_NAME: process.env.DB_NAME,
    STORAGE_BASE_URL: process.env.STORAGE_BASE_URL,
    PROFILE_IMAGE_BASE_URL: process.env.PROFILE_IMAGE_BASE_URL,
    DEFAULT_PROFILE_IMAGE_LOCATION: process.env.DEFAULT_PROFILE_IMAGE_LOCATION,
    DELETED_PROFILE_IMAGE_LOCATION: process.env.DELETED_PROFILE_IMAGE_LOCATION,
    EXAMPLE_CHECK_SCHEDULE: process.env.EXAMPLE_CHECK_SCHEDULE,
    ENABLE_WEB_SOCKET: environmentBoolean(process.env.ENABLE_WEB_SOCKET),
    WEB_SOCKET_PORT: environmentNumber(process.env.WEB_SOCKET_PORT),
    FILE_UPLOAD_SIZE_LIMIT: environmentNumber(
      process.env.FILE_UPLOAD_SIZE_LIMIT
    ),
    LOG_REQUESTS: environmentBoolean(process.env.LOG_REQUESTS)
  }
}

type Config = Required<ENV>

const getSanitizedConfig = (config: ENV) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in .env`)
    }
  }
  return config as Config
}

const config = getConfig()

export default getSanitizedConfig(config)

export { getAccessCookieOptions, getRefreshCookieOptions }
