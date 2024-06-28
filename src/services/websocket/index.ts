import { WebSocketServer } from 'ws'
import { IWebSocketEventData } from './interface'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class WebSocketService {
  private websocket: WebSocketServer
  constructor() {
    this.websocket = new WebSocketServer({ noServer: true });

  }

  connect() {

    this.websocket.on('open', (event) => {
      console.log('WebSocket connection opened:', event)
    })

    this.websocket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    this.websocket.on('close', (event: any) => {
      console.log('WebSocket connection closed:', event)
    })
  }

  emit(event: string, data: IWebSocketEventData) {
    if (this.websocket) {
      this.websocket.emit(event, data)
    } else if (this.websocket) {
      console.error(
        `WebSocket is not open. Ready state is: Ready`
      )
    } else console.error(`Error on websocket initialization`)
  }

  close() {
    if (this.websocket) {
      this.websocket.close()
    }
  }
}
