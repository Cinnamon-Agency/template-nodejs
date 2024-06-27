import { app } from './app'
import config from './config'
import { logger } from './logger'
import wsServiceInstance from './services/websocket'

const port = config.PORT
const commitHash = config.COMMIT_HASH

const server = app.listen(port, () => {
  wsServiceInstance.connect()
  logger.info(
    `Server listening at http://localhost:${port} with commit hash ${commitHash}`
  )
})

export const closeServer = () => {
  wsServiceInstance.close()
  server.close()
}
