import 'reflect-metadata'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import * as MySQLConnector from './services/mysql2'
import router from './routes'
import { requestLogger } from './middleware/http'
import { notFound } from './middleware/notFound'
import { responseFormatter } from './middleware/response'
import config from './config'
import helmet from 'helmet'
import rateLimiter from './middleware/rateLimiter'
import fileUpload from 'express-fileupload'

export const app = express()

app.use(cors())

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(rateLimiter)

// Use body parser to read sent json payloads
app.use(bodyParser.json())

app.use(cookieParser(config.COOKIE_SECRET))

app.use(fileUpload())

if (config.LOG_REQUESTS) {
  app.use(requestLogger)
}

// Redirect root to API docs
app.use((req, res, next) => {
  if (req.url === '/') {
    res.redirect(config.DOCS_BASE_URL)
    return
  }

  next()
})

//Route definitions
app.use('/', router)

/* Response formatting

 Each response includes 3 required fields.
 data - Optional
 code - Mandatory code, a ResponseCodeEnum code, which consists of 5 numbers. The first 3 being the status code of the response, and the last 2 being a code identifier
 message - Mandatory message, a ResponseMessageEnum message which can match the response code, or custom defined by the user
*/
app.use(responseFormatter)

//Catch any non existing routes
app.use(notFound)

//Initialize database connection
MySQLConnector.init()
