import 'reflect-metadata'
import { logger } from '@core/logger'
import { AppServer } from '@core/server'

async function bootstrap() {
  try {
    const { App } = await import('@core/app')

    const app = new App()
    await app.initializeApp()

    const server = new AppServer(app.getApp())
    await server.start()
  } catch (error) {
    logger.error('Failed to start application:', error)
    process.exit(1)
  }
}

void bootstrap()
