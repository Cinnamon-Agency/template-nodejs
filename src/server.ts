import { app } from './app'
import { initializeWebSocketServer } from './services/websocket'
import { scheduleGenericJob } from './services/scheduler'
import { execSync } from 'child_process'
import config from './config'
import { logger } from './logger'

const port = config.PORT
const commitHash = execSync('git rev-parse HEAD').toString().trim()

app.listen(port, () => {
  logger.info(
    `Template listening at http://localhost:${port} with commit hash ${commitHash}`
  )

  if (config.ENABLE_WEB_SOCKET) {
    const socketPort = config.WEB_SOCKET_PORT
    initializeWebSocketServer()
    logger.info(`WebSocket listening at http://localhost:${socketPort}`)
  }
})

if (config.EXAMPLE_CHECK_SCHEDULE) {
  scheduleGenericJob()
  logger.info('Generic job enabled')
}