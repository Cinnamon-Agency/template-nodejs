// ── Time ────────────────────────────────────────────────────
export const MINUTES_TO_MS = 60 * 1000
export const HOURS_TO_MS = 60 * MINUTES_TO_MS
export const DAYS_TO_MS = 24 * HOURS_TO_MS
export const SECONDS_TO_MS = 1000

// ── Verification codes ─────────────────────────────────────
export const PHONE_CODE_LENGTH = 6
export const PHONE_CODE_MIN = 100000
export const PHONE_CODE_MAX = 900000
export const PHONE_CODE_EXPIRY_MINUTES = 10

export const LOGIN_CODE_LENGTH = 4
export const LOGIN_CODE_MIN = 1000
export const LOGIN_CODE_MAX = 9000
export const LOGIN_CODE_EXPIRY_MINUTES = 10

// ── Device tokens ──────────────────────────────────────────
export const DEVICE_TOKEN_DEFAULT_EXPIRY_DAYS = 30

// ── Pagination ─────────────────────────────────────────────
export const DEFAULT_PAGE = 1
export const DEFAULT_PER_PAGE = 10
export const MAX_PER_PAGE = 100
export const NOTIFICATIONS_PER_PAGE = 20

// ── Password ───────────────────────────────────────────────
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

// ── Auth ───────────────────────────────────────────────────
export const CSRF_TOKEN_LENGTH = 32
export const DEVICE_TOKEN_BYTES = 32
