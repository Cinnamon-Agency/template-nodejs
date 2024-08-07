import { AsyncResponse } from '../../interface'
import { Notification } from './notificationModel'

export enum NotificationType {
  ADDED_TO_FAVORITES = 'Added to favorites',
  COLLABORATION_REQUEST = 'Collaboration request'
}

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
  numberOfFetched: number
}

export interface IToogleReadStatus {
  notificationId: string
  read: boolean
  userId: string
}

export interface IDeleteNotification {
  notificationId: string
  userId: string
}

export interface INotificationService {
  createNotification(params: ICreateNotification): AsyncResponse<null>
  getNotifications(params: IGetNotifications): AsyncResponse<Notification[]>
  toogleReadStatus(params: IToogleReadStatus): AsyncResponse<null>
  deleteNotification(params: IDeleteNotification): AsyncResponse<null>
}
