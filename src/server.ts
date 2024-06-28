import { container } from 'tsyringe'
import { app } from './app'
import config from './config'
import { logger } from './logger'
import { WebSocketService } from './services/websocket'

const port = config.PORT
const commitHash = config.COMMIT_HASH
const webSocketService = container.resolve(WebSocketService)

const server = app.listen(port, () => {
  webSocketService.connect()
  logger.info(
    `Server listening at http://localhost:${port} with commit hash ${commitHash}`
  )
})

export const closeServer = () => {
  webSocketService.close()
  server.close()
}
