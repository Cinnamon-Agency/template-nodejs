import { IDeleteNotificationEvent } from '@api/notification/interface'

// Socket.IO event data - can be any serializable data
export type ISocketIOEventData = IDeleteNotificationEvent | Record<string, any>

// Socket.IO types for better type safety
export type SocketIORoom = string
export type SocketIOEvent = string
export type SocketIOClientId = string
