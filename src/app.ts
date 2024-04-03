import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import router from './routes'
import * as TypeormDataSource from './services/typeorm'
import { shutdownHandler } from './middleware/shutdown'
import { requestLogger } from './middleware/http'
import { notFound } from './middleware/notFound'
import { responseFormatter } from './middleware/response'
import { logger } from './logger'
import config from './config'
import helmet from 'helmet'
import rateLimiter from './middleware/rateLimiter'
import fileUpload from 'express-fileupload'
import { closeServer } from './server'

export const app = express()

let shuttingDown = false

app.use(cors())

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(fileUpload({ useTempFiles: true }))

app.use(rateLimiter)

// Use body parser to read sent json payloads
app.use(bodyParser.json())

if (config.LOG_REQUESTS) {
  app.use(requestLogger)
}

// Redirect root to swagger docs
app.use((req, res, next) => {
  if (req.url === '/') {
    res.redirect(config.SWAGGER_BASE_URL)
    return
  }

  next()
})

app.use(shutdownHandler(shuttingDown))

//Route definitions
app.use('/', router)

/* Response formatting

 Each response includes 3 required fields.
 data - Optional
 code - Mandatory code, a ResponseCode code, which consists of 5 numbers. The first 3 being the status code of the response, and the last 2 being a code identifier
 message - Mandatory message, a ResponseMessage message which can match the response code, or custom defined by the user
*/
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