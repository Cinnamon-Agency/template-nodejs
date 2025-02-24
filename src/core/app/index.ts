import express from 'express'
import bodyParser from 'body-parser'
import fileUpload from 'express-fileupload'
import cors from 'cors'
import helmet from 'helmet'
import { router } from '@routes'
import { responseFormatter } from '@middleware/response'
import rateLimiter from '@middleware/rate_limiter'
import config from '@core/config'
import { requestLogger } from '@middleware/http'
import { notFound } from '@middleware/not_found'
import { serverState } from '@core/server/state'
import { shutdownHandler } from '@middleware/shutdown'

export class App {
  private app: express.Express

  constructor() {
    this.app = express()
  }

  public initializeApp() {
    this.app.use(cors())

    this.app.use(
      helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })
    )

    this.app.use(fileUpload({ useTempFiles: true }))

    this.app.use(rateLimiter)

    this.app.use(bodyParser.json())

    if (config.LOG_REQUESTS) {
      this.app.use(requestLogger)
    }

    // Redirect root to swagger docs
    this.app.use((req, res, next) => {
      if (req.url === '/') {
        res.redirect('/api-docs')
        return
      }

      next()
    })

    this.app.use(shutdownHandler(serverState.shuttingDown))

    this.app.use('/', router)

    this.app.use(notFound)

    this.app.use(responseFormatter)
  }

  getApp() {
    if (!this.app) {
      throw new Error('App not initialized')
    }

    return this.app
  }
}
