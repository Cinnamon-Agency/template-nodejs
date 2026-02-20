import { ResponseCode, serviceMethod, normalizePagination, buildPaginatedResult } from '@common'
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
import { getPrismaClient } from '@services/prisma'
import { EmailTemplate } from '@services/aws-ses/interface'

@singleton()
@autoInjectable()
export class NotificationService implements INotificationService {
  constructor(private readonly userService: UserService) {}

  @serviceMethod()
  async getNotifications({
    userId,
    unread,
    page,
    perPage,
  }: IGetNotifications) {
    const pagination = normalizePagination(page, perPage)
    const offset = (pagination.page - 1) * pagination.perPage

    const where: { receiverId: string; read?: boolean } = {
      receiverId: userId,
    }
    if (unread) {
      where.read = false
    }

    const [notifications, total] = await Promise.all([
      getPrismaClient().notification.findMany({
        where,
        skip: offset,
        take: pagination.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      getPrismaClient().notification.count({ where }),
    ])

    return {
      data: buildPaginatedResult(notifications, total, pagination),
      code: ResponseCode.OK,
    }
  }

  @serviceMethod()
  async toggleReadStatus({ notificationId, userId, read }: IToggleReadStatus) {
    const notification = await getPrismaClient().notification.findFirst({
      where: {
        receiverId: userId,
        id: notificationId,
      },
    })

    if (!notification) {
      return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
    }

    await getPrismaClient().notification.update({
      where: { id: notificationId },
      data: { read },
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
    await getPrismaClient().notification.create({
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
    const notification = await getPrismaClient().notification.findFirst({
      where: {
        receiverId: userId,
        id: notificationId,
      },
    })

    if (!notification) {
      return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
    }

    await getPrismaClient().notification.delete({ where: { id: notificationId } })

    return { code: ResponseCode.OK }
  }
}
