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

  const config: ENV = {
    // Server
    NODE_ENV:
      (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
      'development',
    PORT: process.env.PORT || '3000',
    PROJECT_NAME: process.env.PROJECT_NAME || 'template-nodejs',
    COMMIT_HASH: process.env.COMMIT_HASH || 'LOCAL',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    WEB_URL: process.env.WEB_URL || 'http://localhost:3001',

    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',

    // Documentation
    DOCS_USER: process.env.DOCS_USER || '',
    DOCS_PASSWORD: process.env.DOCS_PASSWORD || '',

    // Authentication
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || '',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || '',
    ACCESS_TOKEN_EXPIRES_IN: environmentNumber(
      process.env.ACCESS_TOKEN_EXPIRES_IN || '15'
    ),
    REFRESH_TOKEN_EXPIRES_IN: environmentNumber(
      process.env.REFRESH_TOKEN_EXPIRES_IN || '10080'
    ), // 7 days in minutes

    // Logging
    LOG_REQUESTS: environmentBoolean(process.env.LOG_REQUESTS),
    LOG_TO_CONSOLE: environmentBoolean(process.env.LOG_TO_CONSOLE),

    // Redis
    REDIS_URL: process.env.REDIS_URL || '',

    // Rate Limiting
    RATE_LIMITER_DURATION_IN_SECONDS: environmentNumber(
      process.env.RATE_LIMITER_DURATION_IN_SECONDS || '60'
    ),
    RATE_LIMITER_POINTS: environmentNumber(
      process.env.RATE_LIMITER_POINTS || '5'
    ),
    RATE_LIMITER_BLOCKING_DURATION_IN_SECONDS: environmentNumber(
      process.env.RATE_LIMITER_BLOCKING_DURATION_IN_SECONDS || '300'
    ),
    LOGIN_LIMITER_POINTS: environmentNumber(
      process.env.LOGIN_LIMITER_POINTS || '5'
    ),
    LOGIN_LIMITER_DURATION_IN_SECONDS: environmentNumber(
      process.env.LOGIN_LIMITER_DURATION_IN_SECONDS || '60'
    ),
    LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS: environmentNumber(
      process.env.LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS || '300'
    ),

    // AWS
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || '',
    AWS_SECRET: process.env.AWS_SECRET || '',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',

    // Email
    SES_VERIFIED_MAIL: process.env.SES_VERIFIED_MAIL || 'noreply@example.com',

    // SMS
    SMS_VERIFIED_PHONE_NUMBER: process.env.SMS_VERIFIED_PHONE_NUMBER || '',

    // Google Cloud
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION:
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION || '',
    GOOGLE_CLOUD_STORAGE_BUCKET_NAME:
      process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME || '',

    // Seed
    SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD || '',

    // Security
    SALT_ROUNDS: environmentNumber(process.env.SALT_ROUNDS || '10'),
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3001',
  }

  cachedConfig = getSanitizedConfig(config)

  return cachedConfig
}

const REQUIRED_IN_PRODUCTION: (keyof ENV)[] = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
]

const getSanitizedConfig = (config: ENV) => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing value for ${key} in .env`)
    }
  }

  if (config.NODE_ENV === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!config[key]) {
        throw new Error(
          `Missing required production config: ${key}. Set it in your environment variables.`
        )
      }
    }
  }

  return config as Config
}

export default getConfig()
