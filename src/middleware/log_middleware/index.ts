import { NextFunction, Request, Response } from 'express'
import { sendLogEvents } from '../../services/cloudwatch'
import config from '@core/config'

/**
 * Mask sensitive information in objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function maskSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'apiKey',
    'apikey',
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const masked: any = Array.isArray(obj) ? [] : {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase()
      const value = obj[key]

      if (value && typeof value === 'object') {
        masked[key] = maskSensitiveData(value)
      } else if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        masked[key] = '***MASKED***'
      } else if (
        typeof value === 'string' &&
        (value.includes('Bearer ') || value.includes('Basic '))
      ) {
        masked[key] = '***AUTH_TOKEN***'
      } else {
        masked[key] = value
      }
    }
  }
  return masked
}

const cloudWatchMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = process.hrtime()
  const requestId =
    req.headers['x-request-id'] ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const originalSend = res.send
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let responseBody: any = null

  res.send = function (body) {
    responseBody = body
    return originalSend.call(res, body)
  }

  res.on('finish', async () => {
    const [seconds, nanoseconds] = process.hrtime(startTime)
    const responseTimeMs = seconds * 1000 + nanoseconds / 1e6

    // Only log errors and slow requests (>1000ms)
    const isError = res.statusCode >= 400
    const isSlow = responseTimeMs > 1000

    if (!isError && !isSlow) {
      return // Skip logging for successful fast requests
    }

    let errorDetails = null
    if (res.errored) {
      const error = res.errored as Error & {
        code?: string
        statusCode?: number
      }
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: config.NODE_ENV === 'production' ? undefined : error.stack,
        ...(error.code && { code: error.code }),
        ...(error.statusCode && { statusCode: error.statusCode }),
      }
    }

    // Compact log format - only essential fields
    const logEntry = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${responseTimeMs.toFixed(2)}ms`,
      // Only include query/params if present
      ...(Object.keys(req.query).length > 0 && {
        query: maskSensitiveData(req.query),
      }),
      ...(Object.keys(req.params).length > 0 && {
        params: maskSensitiveData(req.params),
      }),
      // Only include request body for errors
      ...(isError &&
        req.body &&
        Object.keys(req.body).length > 0 && {
          requestBody: maskSensitiveData(req.body),
        }),
      // Only include user agent for errors
      ...(isError && { userAgent: req.get('user-agent') }),
      // Only include error details if error occurred
      ...(errorDetails && { error: errorDetails }),
      // Only include response body for errors
      ...(isError &&
        responseBody && {
          responseBody: maskSensitiveData(
            typeof responseBody === 'string'
              ? safeJsonParse(responseBody)
              : responseBody
          ),
        }),
    }

    try {
      // Compact JSON without indentation
      const logString = JSON.stringify(logEntry)

      // Send to CloudWatch
      await sendLogEvents(logString)

      // Also log to console in development
      if (config.NODE_ENV === 'development') {
        const logMethod = res.statusCode >= 400 ? 'error' : 'info'
        // eslint-disable-next-line no-console
        console[logMethod](
          `[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTimeMs.toFixed(2)}ms)`
        )
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in cloudWatchMiddleware:', error)
    }
  })

  next()
}

// Helper function to safely parse JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

export default cloudWatchMiddleware
