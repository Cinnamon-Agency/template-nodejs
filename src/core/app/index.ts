// Node.js modules
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'

// External libraries
import helmet from 'helmet'

// Internal modules
import { router } from '@routes'
import '@services/prisma' // registers PrismaClient in DI container
import { responseFormatter } from '@middleware/response'
import rateLimiter from '@middleware/rate_limiter'
import config from '@core/config'
import { requestLogger } from '@middleware/http'
import cloudWatchMiddleware from '@middleware/log_middleware'
import { notFound } from '@middleware/not_found'
import { globalErrorHandler } from '@middleware/error_handler'
import { csrfProtection } from '@middleware/csrf'
import { sanitizeInput } from '@middleware/sanitize'
import { requestIdMiddleware } from '@middleware/request_id'
import { serverState } from '@core/server/state'
import { shutdownHandler } from '@middleware/shutdown'

export class App {
  private app: express.Express

  constructor() {
    this.app = express()
  }

  public initializeApp() {
    this.app.use(
      cors({
        credentials: true,
        origin: config.ALLOWED_ORIGINS
          ? config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
          : 'http://localhost:3001',
      })
    )

    this.app.use(cookieParser())

    this.app.use(
      helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })
    )

    this.app.use(requestIdMiddleware)

    this.app.use(rateLimiter)

    this.app.use((req, res, next) => {
      if (req.originalUrl === '/api/v1/webhook') {
        bodyParser.raw({ type: 'application/json' })(req, res, next)
      } else {
        bodyParser.json()(req, res, next)
      }
    })
    this.app.use(sanitizeInput)

    if (config.LOG_REQUESTS) {
      this.app.use(requestLogger)
    }

    this.app.use(cloudWatchMiddleware)

    this.app.use((req, res, next) => {
      if (req.url === '/') {
        res.redirect('/api-docs')
        return
      }

      next()
    })

    this.app.get('/api/v1/healthcheck', (req, res) => {
      res.status(200).json({ status: 'ok' })
    })

    this.app.use(csrfProtection)

    this.app.use(shutdownHandler(serverState))

    this.app.use('/', router)

    this.app.use(notFound)

    this.app.use(responseFormatter)

    this.app.use(globalErrorHandler)
  }

  getApp() {
    if (!this.app) {
      throw new Error('App not initialized')
    }

    return this.app
  }
}
