import { AsyncResponse } from '@common'
import { Notification, NotificationType } from '@prisma/client'

export interface IDeleteNotificationEvent {
  notificationId: string
}

export interface ICreateNotification {
  senderId: string
  receiverId: string
  message: string
  type: NotificationType
}

export interface IGetNotifications {
  unread: boolean
  userId: string
  page: number
  perPage: number
}

export interface IToggleReadStatus {
  notificationId: string
  read: boolean
  userId: string
}

export interface IDeleteNotification {
  notificationId: string
  userId: string
}

export interface INotificationService {
  createNotification(params: ICreateNotification): AsyncResponse<void>
  getNotifications(params: IGetNotifications): AsyncResponse<Notification[]>
  toggleReadStatus(params: IToggleReadStatus): AsyncResponse<void>
  deleteNotification(params: IDeleteNotification): AsyncResponse<void>
}
