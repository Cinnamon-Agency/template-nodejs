import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { authenticateDocs } from '../middleware/auth'
import { APIDocumentation } from '../documentation'

export const docsRouter = express.Router()

//API documentation protected by basic auth and served under /api-docs
docsRouter.use(
  '/',
  authenticateDocs,
  swaggerUi.serveFiles(APIDocumentation),
  swaggerUi.setup(APIDocumentation, {
    swaggerOptions: {
      filter: true
    }
  })
)
