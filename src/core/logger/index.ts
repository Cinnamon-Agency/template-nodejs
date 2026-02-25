// External libraries
import winston, { createLogger, format } from 'winston'

// Internal modules
import config from '../config'

const { timestamp, combine, printf, errors, json } = format

const consoleLogFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  return `${timestamp} ${level}: ${stack || message}${metaString ? '\n' + metaString : ''}`
})

const structuredLogFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
)

const levels = {
  emerg: 0,
  crit: 1,
  error: 2,
  warning: 3,
  info: 4,
  debug: 5,
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.LOG_TO_CONSOLE
      ? combine(
          format.colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          consoleLogFormat
        )
      : structuredLogFormat,
    silent: !config.LOG_TO_CONSOLE && config.NODE_ENV === 'test',
  }),
]

export const logger = createLogger({
  levels,
  transports,
  defaultMeta: { 
    environment: process.env.NODE_ENV || 'null',
    service: 'cinnamon-template-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  format: config.NODE_ENV === 'production' ? structuredLogFormat : combine(
    format.colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    consoleLogFormat
  ),
  exceptionHandlers: config.LOG_TO_CONSOLE ? [
    new winston.transports.Console({
      format: combine(
        format.colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleLogFormat
      ),
    })
  ] : [],
  rejectionHandlers: config.LOG_TO_CONSOLE ? [
    new winston.transports.Console({
      format: combine(
        format.colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleLogFormat
      ),
    })
  ] : [],
})

// Enhanced error logging utility
export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error('Application error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
  })
}

// Structured logging utility
export const logStructured = (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>) => {
  logger.log(level, message, {
    ...meta,
    timestamp: new Date().toISOString(),
  })
}

// Performance logging utility
export const logPerformance = (operation: string, duration: number, context?: Record<string, unknown>) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    context,
    timestamp: new Date().toISOString(),
  })
}

export const httpLogger = createLogger({
  levels: { http: 1 },
  transports: config.LOG_REQUESTS
    ? [
        new winston.transports.Console({
          format: combine(
            format.colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            consoleLogFormat
          ),
        }),
      ]
    : [],
})
