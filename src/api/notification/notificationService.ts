import { ResponseCode, serviceMethod } from '@common'
import { autoInjectable, singleton } from 'tsyringe'
import {
  ICreateNotification,
  INotificationService,
  IGetNotifications,
  IDeleteNotification,
  IToggleReadStatus,
} from './interface'
import { sendEmail } from '@services/aws-ses'
import { UserService } from '@api/user/userService'
import { prisma } from '@app'
import { EmailTemplate } from '@services/aws-ses/interface'

@singleton()
@autoInjectable()
export class NotificationService implements INotificationService {
  constructor(private readonly userService: UserService) {}

  @serviceMethod()
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

  @serviceMethod()
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

  @serviceMethod()
  async createNotification({
    receiverId,
    senderId,
    message,
    type: notificationType,
  }: ICreateNotification) {
    await prisma.notification.create({
      data: {
        receiverId,
        senderId,
        message,
        read: false,
        notificationType,
      },
    })

    const { user } = await this.userService.getUserById({
      userId: receiverId,
    })

    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    await sendEmail(EmailTemplate.NOTIFICATION, user.email, notificationType, {
      title: notificationType,
      content: message,
    })

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
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
