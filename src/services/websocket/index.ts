import { WebSocket, WebSocketServer } from 'ws'
import { KeyType, verifyToken } from '../jsonwebtoken'
import { createServer } from 'http'
import { getResponseMessage } from '../../services/utils'
import { StatusCode } from '../../interfaces'
import { logger } from '../../logger'

//Define static authenticated clients elsewhere
let authenticatedClients: Map<number, WebSocket>

export const initializeWebSocketServer = async () => {
  try {
    const server = createServer()
    const wss = new WebSocketServer({ noServer: true })

    authenticatedClients = new Map<number, WebSocket>()

    wss.on('connection', async (ws: WebSocket) => {
      ws.on('error', (err: any) => {
        const code = StatusCode.SERVICE_UNAVAILABLE
        logger.error({
          code,
          message: getResponseMessage(code),
          stack: err.stack
        })
      })

      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('close', () => {
        authenticatedClients.delete(ws.userId)
      })
    })

    // Initiate ping-pong mechanism to ensure connection is alive
    if (process.env.ENABLE_WEB_SOCKET_PING_PONG == 'true') {
      const interval = setInterval(() => {
        if (authenticatedClients.size > 0) {
          authenticatedClients.forEach((ws) => {
            if (ws.isAlive === false) {
              authenticatedClients.delete(ws.userId)
              return ws.terminate()
            }
            ws.isAlive = false
            ws.ping()
          })
        }
      }, 15000)
    }

    server.on('upgrade', async (request, socket, head) => {
      socket.on('error', (err: any) => {
        const code = StatusCode.SERVICE_UNAVAILABLE
        logger.error({
          code,
          message: getResponseMessage(code),
          stack: err.stack
        })
      })

      // Get the JWT from the client's headers
      const accessToken = request.headers.access_token

      if (typeof accessToken === 'string' && accessToken.startsWith('Bearer')) {
        const token = accessToken.split(' ')[1]
        const decodedToken = await verifyToken<any>(
          token,
          KeyType.ACCESS_TOKEN_PRIVATE_KEY
        )
        if (
          !decodedToken ||
          typeof decodedToken.payload === 'string' ||
          !decodedToken.sub
        ) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
          socket.destroy()
          return
        }

        wss.handleUpgrade(request, socket, head, (ws: any) => {
          ws.userId = decodedToken.sub
          ws.expiration = decodedToken.exp
          ws.isAlive = false

          authenticatedClients.set(ws.userId, ws)
          wss.emit('connection', ws, request, socket)
        })
      } else {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }
    })

    server.listen(process.env.WEB_SOCKET_PORT)
  } catch (err: any) {
    const code = StatusCode.SERVICE_UNAVAILABLE
    logger.error({ code, message: getResponseMessage(code), stack: err.stack })
  }
}
