import express from 'express'
import bodyParser from 'body-parser'
import fileUpload from 'express-fileupload'
import cors from 'cors'
import helmet from 'helmet'
import router from './routes'
import { responseFormatter } from './middleware/response'
import rateLimiter from './middleware/rate_limiter'
import config from './config'
import { requestLogger } from './middleware/http'
import { notFound } from './middleware/not_found'
import { shutdownHandler } from './middleware/shutdown'
import { logger } from './logger'
import { closeServer } from './server'
import * as TypeormDataSource from './services/typeorm'

export const app = express()

let shuttingDown = false

app.use(cors())

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(fileUpload({ useTempFiles: true }))

app.use(rateLimiter)

app.use(bodyParser.json())

if (config.LOG_REQUESTS) {
  app.use(requestLogger)
}

app.use((req, res, next) => {
  if (req.url === '/') {
    res.redirect('/api-docs')
    return
  }

  next()
})

app.use(shutdownHandler(shuttingDown))

app.use('/', router)

app.use(responseFormatter)

app.use(notFound)

TypeormDataSource.init()

const shutdown = (signal: string) => {
  try {
    shuttingDown = true
    logger.info(`Received ${signal}`)
    logger.info('*** App is now closing ***')

    TypeormDataSource.AppDataSource.destroy()

    closeServer()
    process.exit(0)
  } catch (err) {
    logger.info(err)
  }
}

process.on('SIGINT', shutdown)

process.on('SIGTERM', shutdown)
