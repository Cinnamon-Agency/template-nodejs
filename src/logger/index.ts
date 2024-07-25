import winston, { createLogger, format } from 'winston'
import config from '../config'
const { timestamp, combine, printf, errors } = format

const consoleLogFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`
})

const levels = {
  emerg: 0,
  crit: 1,
  error: 2,
  warning: 3,
  info: 4,
  debug: 5
}

const transports: any = []

if (config.LOG_TO_CONSOLE) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        format.colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleLogFormat
      )
    })
  )
}

export const logger = createLogger({
  levels,
  transports,
  defaultMeta: { environment: process.env.NODE_ENV || 'null' }
})

export const httpLogger = createLogger({
  levels: { http: 1 },
  transports: process.env.LOG_REQUESTS
    ? [
        new winston.transports.Console({
          format: combine(
            format.colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            consoleLogFormat
          )
        })
      ]
    : []
})
