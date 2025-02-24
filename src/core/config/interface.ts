export interface ENV {
  COMMIT_HASH?: string
  PROJECT_NAME?: string
  NODE_ENV?: string
  PORT?: number
  ACCESS_TOKEN_SECRET?: string
  REFRESH_TOKEN_SECRET?: string
  ACCESS_TOKEN_EXPIRES_IN?: number
  REFRESH_TOKEN_EXPIRES_IN?: number
  LOG_REQUESTS?: boolean
  LOG_TO_CONSOLE?: boolean
  API_BASE_URL?: string
  DOCS_USER?: string
  DOCS_PASSWORD?: string
  DB_HOSTNAME?: string
  DB_PORT?: number
  DB_USERNAME?: string
  DB_PASSWORD?: string
  DB_NAME?: string
  SALT_ROUNDS?: number
  RATE_LIMITER_POINTS?: number
  RATE_LIMITER_DURATION_IN_SECONDS?: number
  LOGIN_LIMITER_POINTS?: number
  LOGIN_LIMITER_DURATION_IN_SECONDS?: number
  LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS?: number
  GMAIL_MAIL?: string
  GMAIL_PASSWORD?: string
  GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION?: string
  GOOGLE_CLOUD_STORAGE_BUCKET_NAME?: string
  GOOGLE_CLOUD_PROJECT_ID?: string
  TYPEORM_SYNCHRONIZE?: boolean
  TYPEORM_RUN_MIGRATIONS?: boolean
  USE_UNIX_SOCKET?: boolean
  DB_POOL_SIZE?: number
}

export type Config = Required<ENV>
