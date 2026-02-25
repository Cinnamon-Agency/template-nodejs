import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { IWebSocketEventData } from './interface'
import { autoInjectable, singleton } from 'tsyringe'
import { logger } from '@core/logger'

@singleton()
@autoInjectable()
export class WebSocketService {
  private wss: WebSocketServer

  constructor() {
    this.wss = new WebSocketServer({ noServer: true })
  }

  /**
   * Attach upgrade handling to an HTTP server and listen for connections.
   */
  attach(server: Server) {
    server.on('upgrade', (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, ws => {
        this.wss.emit('connection', ws, request)
      })
    })

    this.wss.on('connection', ws => {
      logger.info('WebSocket client connected')

      ws.on('error', error => {
        logger.error('WebSocket client error:', error)
      })

      ws.on('close', () => {
        logger.info('WebSocket client disconnected')
      })
    })

    this.wss.on('error', error => {
      logger.error('WebSocket server error:', error)
    })
  }

  /**
   * Broadcast an event with data to all connected clients.
   */
  emit(event: string, data: IWebSocketEventData) {
    const message = JSON.stringify({ event, data })

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
