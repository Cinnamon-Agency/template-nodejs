import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'
import { autoInjectable, singleton } from 'tsyringe'
import { logger } from '@core/logger'
import config from '@core/config'
import { ISocketIOEventData, SocketIORoom, SocketIOEvent, SocketIOClientId } from './interface'

@singleton()
@autoInjectable()
export class SocketIOService {
  private io: Server
  private pubClient: Redis | null = null
  private subClient: Redis | null = null

  constructor() {
    this.io = new Server({
      cors: {
        origin: config.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    })

    this.setupRedisAdapter()
  }

  private setupRedisAdapter() {
    if (!config.REDIS_URL) {
      logger.warn('REDIS_URL not configured - Socket.IO will work in single-instance mode only')
      return
    }

    try {
      this.pubClient = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })

      this.subClient = this.pubClient.duplicate()

      this.io.adapter(createAdapter(this.pubClient, this.subClient))

      this.pubClient.on('connect', () => {
        logger.info('Socket.IO Redis pub client connected')
      })

      this.subClient.on('connect', () => {
        logger.info('Socket.IO Redis sub client connected')
      })

      this.pubClient.on('error', (err) => {
        logger.error('Socket.IO Redis pub client error:', err)
      })

      this.subClient.on('error', (err) => {
        logger.error('Socket.IO Redis sub client error:', err)
      })

      logger.info('Socket.IO Redis adapter configured successfully')
    } catch (error) {
      logger.error('Failed to setup Socket.IO Redis adapter:', error)
    }
  }

  attach(server: any) {
    this.io.attach(server)

    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id} from ${socket.handshake.address}`)

      socket.on('disconnect', (reason) => {
        logger.info(`Socket disconnected: ${socket.id} - ${reason}`)
      })

      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error)
      })
    })

    logger.info('Socket.IO server attached to HTTP server')
  }

  // Emit to all clients across all instances
  emit(event: SocketIOEvent, data: ISocketIOEventData) {
    this.io.emit(event, data)
  }

  // Emit to specific room across all instances
  emitToRoom(room: SocketIORoom, event: SocketIOEvent, data: ISocketIOEventData) {
    this.io.to(room).emit(event, data)
  }

  // Emit to specific client across all instances
  emitToClient(socketId: SocketIOClientId, event: SocketIOEvent, data: ISocketIOEventData) {
    this.io.to(socketId).emit(event, data)
  }

  // Join room
  joinRoom(socketId: SocketIOClientId, room: SocketIORoom) {
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.join(room)
      logger.info(`Socket ${socketId} joined room: ${room}`)
    }
  }

  // Leave room
  leaveRoom(socketId: SocketIOClientId, room: SocketIORoom) {
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.leave(room)
      logger.info(`Socket ${socketId} left room: ${room}`)
    }
  }

  // Get all rooms for a socket
  getSocketRooms(socketId: SocketIOClientId): Set<string> | undefined {
    const socket = this.io.sockets.sockets.get(socketId)
    return socket?.rooms
  }

  // Get all connected clients count
  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount
  }

  // Get all sockets in a room
  getSocketsInRoom(room: SocketIORoom): string[] {
    const roomSockets = this.io.sockets.adapter.rooms.get(room)
    return roomSockets ? Array.from(roomSockets) : []
  }

  // Check if Redis adapter is active
  isRedisAdapterActive(): boolean {
    return !!(this.pubClient && this.subClient)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: any }> {
    const details: any = {
      connectedClients: this.getConnectedClientsCount(),
      redisAdapter: this.isRedisAdapterActive(),
    }

    if (this.pubClient) {
      try {
        await this.pubClient.ping()
        details.redisConnection = 'healthy'
      } catch (error) {
        details.redisConnection = 'unhealthy'
        details.redisError = error instanceof Error ? error.message : String(error)
      }
    }

    return {
      status: details.redisConnection === 'unhealthy' ? 'degraded' : 'healthy',
      details,
    }
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        if (this.pubClient) {
          this.pubClient.disconnect()
        }
        if (this.subClient) {
          this.subClient.disconnect()
        }
        resolve()
      })
    })
  }
}
