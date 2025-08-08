import { ResponseCode, serviceErrorHandler } from '@common'
import { autoInjectable, container, singleton } from 'tsyringe'
import {
  ICreateNotification,
  INotificationService,
  IGetNotifications,
  IDeleteNotification,
  IToggleReadStatus,
} from './interface'
import { sendEmail } from '@services/ses'
import { UserService } from '@api/user/userService'
import prisma from '@core/prismaClient'
import { EmailTemplate } from '@services/ses/interface'

const userService = container.resolve(UserService)

@singleton()
@autoInjectable()
export class NotificationService implements INotificationService {
  @serviceErrorHandler()
  async getNotifications({
    userId,
    unread,
    numberOfFetched,
  }: IGetNotifications) {
    const where: { receiverId: string; read?: boolean } = {
      receiverId: userId,
    }
    if (unread) {
      where.read = false
    }
    const notifications = await prisma.notification.findMany({
      where,
      skip: numberOfFetched,
      take: 20,
    })

    return { notifications, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async toggleReadStatus({ notificationId, userId, read }: IToggleReadStatus) {
    const notification = await prisma.notification.findUnique({
      where: {
        receiverId: userId,
        id: notificationId,
      },
    })

    if (!notification) {
      return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
    }

    notification.read = read

    await prisma.notification.update({
      where: { id: notificationId },
      data: notification,
    })

    return { code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async createNotification({
    receiverId,
    senderId,
    message,
    type,
  }: ICreateNotification) {
    const notification = { receiverId, senderId, message, read: false, type }
    await prisma.notification.create({ data: notification })

    const { user } = await userService.getUserById({
      userId: receiverId,
    })

    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    sendEmail(EmailTemplate.NOTIFICATION, user.email, type, {
      title: type,
      content: message,
    })

    return { code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async deleteNotification({ userId, notificationId }: IDeleteNotification) {
    const notification = await prisma.notification.findUnique({
      where: {
        receiverId: userId,
        id: notificationId,
      },
    })

    if (!notification) {
      return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
    }

    await prisma.notification.delete({ where: { id: notificationId } })

    return { code: ResponseCode.OK }
  }
}
