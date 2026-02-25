import { Express } from 'express'
import { Server } from 'http'
import { logger } from '@core/logger'
import config from '@core/config'
import { serverState } from './state'
import { container } from 'tsyringe'

import { WebSocketService } from '@services/websocket'
import { getPrismaClient } from '@services/prisma'

export class AppServer {
  private server: Server | null = null

  constructor(private app: Express) {}

  public start(): void {
    process.on('SIGINT', () => this.shutdown('SIGINT'))
    process.on('SIGTERM', () => this.shutdown('SIGTERM'))

    // Global error monitoring
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
    })
    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception thrown:', error)
      process.exit(1)
    })

    const port = config.PORT
    const commitHash = config.COMMIT_HASH

    this.server = this.app.listen(port, () => {
      logger.info(
        `Server listening at http://localhost:${port} with commit hash ${commitHash}`
      )
    })

    const webSocketService = container.resolve(WebSocketService)
    webSocketService.attach(this.server)
  }

  private async shutdown(signal: string): Promise<void> {
    if (serverState.shuttingDown) {
      return
    }

    try {
      serverState.shuttingDown = true
      logger.info(`Received ${signal}`)
      logger.info('*** App is now closing ***')

      const shutdownTasks = []

      shutdownTasks.push(getPrismaClient().$disconnect())

      const webSocketService = container.resolve(WebSocketService)
      // Properly invoke close() to get a promise
      shutdownTasks.push(webSocketService.close())

      if (this.server) {
        shutdownTasks.push(
          new Promise<void>((resolve, reject) => {
            this.server?.close(err => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
          })
        )
      }

      const timeout = setTimeout(() => {
        logger.error('Shutdown timed out.')
        process.exit(1)
      }, 10000)

      await Promise.all(shutdownTasks)
      clearTimeout(timeout)

      logger.info('*** App has shut down ***')
      process.exit(0)
    } catch (err) {
      logger.error('Error during shutdown:', err)
      process.exit(1)
    }
  }
}
