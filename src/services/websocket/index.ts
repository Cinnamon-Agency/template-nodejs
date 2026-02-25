import { WebSocketServer } from 'ws'
import { IWebSocketEventData } from './interface'
import { autoInjectable, singleton } from 'tsyringe'
import { logger } from '@core/logger'

@singleton()
@autoInjectable()
export class WebSocketService {
  private websocket: WebSocketServer
  constructor() {
    this.websocket = new WebSocketServer({ noServer: true })
  }

  connect() {
    this.websocket.on('open', event => {
      logger.info('WebSocket connection opened:', event)
    })

    this.websocket.on('error', error => {
      logger.error('WebSocket error:', error)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.websocket.on('close', (event: any) => {
      logger.info('WebSocket connection closed:', event)
    })
  }

  emit(event: string, data: IWebSocketEventData) {
    if (this.websocket) {
      this.websocket.emit(event, data)
    } else {
      logger.error(`WebSocket is not initialized`)
    }
  }

  close() {
    if (this.websocket) {
      this.websocket.close()
    }
  }
}
