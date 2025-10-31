export interface ENV {
  // Server
  NODE_ENV?: string
  PORT?: string
  PROJECT_NAME?: string
  COMMIT_HASH?: string
  API_BASE_URL?: string
  WEB_URL?: string

  // Database
  DATABASE_URL?: string

  // Documentation
  DOCS_USER?: string
  DOCS_PASSWORD?: string

  // Authentication
  ACCESS_TOKEN_SECRET?: string
  REFRESH_TOKEN_SECRET?: string
  ACCESS_TOKEN_EXPIRES_IN?: number
  REFRESH_TOKEN_EXPIRES_IN?: number

  // Logging
  LOG_REQUESTS?: boolean
  LOG_TO_CONSOLE?: boolean

  // Rate Limiting
  RATE_LIMITER_DURATION_IN_SECONDS?: number
  RATE_LIMITER_POINTS?: number
  RATE_LIMITER_BLOCKING_DURATION_IN_SECONDS?: number
  LOGIN_LIMITER_POINTS?: number
  LOGIN_LIMITER_DURATION_IN_SECONDS?: number
  LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS?: number

  // AWS
  AWS_ACCESS_KEY?: string
  AWS_SECRET?: string
  AWS_REGION?: string

  // Email
  SES_VERIFIED_MAIL?: string

  // SMS
  SMS_VERIFIED_PHONE_NUMBER?: string

  // Google Cloud
  GOOGLE_CLOUD_PROJECT_ID?: string
  GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION?: string
  GOOGLE_CLOUD_STORAGE_BUCKET_NAME?: string

  // Security
  SALT_ROUNDS?: number
  ALLOWED_ORIGINS?: string
}

export type Config = Required<ENV>
