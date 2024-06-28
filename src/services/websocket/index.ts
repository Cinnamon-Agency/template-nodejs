import { WebSocket } from 'ws'
import config from '../../config'
import { IWebSocketEventData } from './interface'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class WebSocketService {
  private websocket: WebSocket

  constructor() {
    this.websocket = new WebSocket(config.WEB_SOCKET_URL)
  }

  connect() {
    if (this.websocket && this.websocket.readyState !== WebSocket.CLOSED) {
      console.warn('WebSocket is already connected.')
      return
    }

    this.websocket.onopen = (event) => {
      console.log('WebSocket connection opened:', event)
    }

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.websocket.onclose = (event) => {
      console.log('WebSocket connection closed:', event)
      // Optionally, you can try to reconnect
    }
  }

  emit(event: string, data: IWebSocketEventData) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.emit(event, data)
    } else if (this.websocket) {
      console.error(
        `WebSocket is not open. Ready state is: ${this.websocket.readyState}`
      )
    } else console.error(`Error on websocket initialization`)
  }

  close() {
    if (this.websocket) {
      this.websocket.close()
    }
  }
}
