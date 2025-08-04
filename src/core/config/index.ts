import { Config, ENV } from './interface'

let cachedConfig: Config | undefined

const environmentNumber = (envNum: unknown): number | undefined => {
  return envNum ? Number(envNum) : undefined
}

const environmentBoolean = (envBool: unknown): boolean | undefined => {
  return envBool === 'true' || envBool === 'false'
    ? envBool === 'true'
    : undefined
}

const getConfig = (): Config => {
  if (cachedConfig) return cachedConfig

  const config = {
    COMMIT_HASH: process.env.COMMIT_HASH,
    PROJECT_NAME: process.env.PROJECT_NAME,
    NODE_ENV: process.env.NODE_ENV,
    PORT: environmentNumber(process.env.PORT),
    API_BASE_URL: process.env.API_BASE_URL,
    LOG_TO_CONSOLE: environmentBoolean(process.env.LOG_TO_CONSOLE),
    LOG_REQUESTS: environmentBoolean(process.env.LOG_REQUESTS),
    DOCS_USER: process.env.DOCS_USER,
    DOCS_PASSWORD: process.env.DOCS_PASSWORD,
    DB_HOSTNAME: process.env.DB_HOSTNAME,
    DB_PORT: environmentNumber(process.env.DB_PORT),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    TYPEORM_SYNCHRONIZE: environmentBoolean(process.env.TYPEORM_SYNCHRONIZE),
    TYPEORM_RUN_MIGRATIONS: environmentBoolean(
      process.env.TYPEORM_RUN_MIGRATIONS
    ),
    SALT_ROUNDS: environmentNumber(process.env.SALT_ROUNDS),
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: environmentNumber(
      process.env.ACCESS_TOKEN_EXPIRES_IN
    ),
    REFRESH_TOKEN_EXPIRES_IN: environmentNumber(
      process.env.REFRESH_TOKEN_EXPIRES_IN
    ),
    RATE_LIMITER_POINTS: environmentNumber(process.env.RATE_LIMITER_POINTS),
    RATE_LIMITER_DURATION_IN_SECONDS: environmentNumber(
      process.env.RATE_LIMITER_DURATION_IN_SECONDS
    ),
    LOGIN_LIMITER_POINTS: environmentNumber(process.env.LOGIN_LIMITER_POINTS),
    LOGIN_LIMITER_DURATION_IN_SECONDS: environmentNumber(
      process.env.LOGIN_LIMITER_DURATION_IN_SECONDS
    ),
    LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS: environmentNumber(
      process.env.LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS
    ),
    GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION:
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION,
    GOOGLE_CLOUD_STORAGE_BUCKET_NAME:
      process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME,
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    GMAIL_MAIL: process.env.GMAIL_MAIL,
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD,
    USE_UNIX_SOCKET: environmentBoolean(process.env.USE_UNIX_SOCKET),
    DB_POOL_SIZE: environmentNumber(process.env.DB_POOL_SIZE),
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_SECRET: process.env.AWS_SECRET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_PHONE_NUMBER: process.env.AWS_PHONE_NUMBER,
  }

  cachedConfig = getSanitizedConfig(config)

  return cachedConfig
}

const getSanitizedConfig = (config: ENV) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing value for ${key} in .env`)
    }
  }
  return config as Config
}

export default getConfig()
