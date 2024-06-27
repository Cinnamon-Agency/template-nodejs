import { WebSocket } from 'ws'
import config from '../../config'
import { IWebSocketEventData } from './interface'

class WebSocketService {
  private url: string
  private websocket: WebSocket | null = null

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (this.websocket && this.websocket.readyState !== WebSocket.CLOSED) {
      console.warn('WebSocket is already connected.')
      return
    }

    this.websocket = new WebSocket(this.url)

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

const wsServiceInstance = new WebSocketService(config.WEB_SOCKET_URL)

export default wsServiceInstance
