import { ResponseCode, serviceErrorHandler } from '@common'
import { autoInjectable, container, inject, singleton } from 'tsyringe'
import { Notification } from './notificationModel'
import { DataSource, Repository } from 'typeorm'
import {
  ICreateNotification,
  INotificationService,
  IGetNotifications,
  IDeleteNotification,
  IToggleReadStatus,
} from './interface'
import { sendEmail } from '@services/email'
import { UserService } from '@api/user/userService'

const userService = container.resolve(UserService)

@singleton()
@autoInjectable()
export class NotificationService implements INotificationService {
  private readonly notificationRepository: Repository<Notification>

  constructor(@inject(DataSource) private readonly dataSource: DataSource) {
    this.notificationRepository =
      this.dataSource.manager.getRepository(Notification)
  }

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
    const notifications = await this.notificationRepository.find({
      where,
      skip: numberOfFetched,
      take: 20,
    })

    return { notifications, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async toggleReadStatus({ notificationId, userId, read }: IToggleReadStatus) {
    const notification = await this.notificationRepository.findOne({
      where: {
        receiverId: userId,
        id: notificationId,
      },
    })

    if (!notification) {
      return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
    }

    notification.read = read

    await this.notificationRepository.save(notification)

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
    await this.notificationRepository.save(notification)

    const { user } = await userService.getUserById({
      userId: receiverId,
    })

    if (!user) {
      return { code: ResponseCode.USER_NOT_FOUND }
    }

    sendEmail({
      revieverMail: user.email,
      message: { title: type, content: message },
    })

    return { code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async deleteNotification({ userId, notificationId }: IDeleteNotification) {
    const notification = await this.notificationRepository.findOne({
      where: {
        receiverId: userId,
        id: notificationId,
      },
    })

    if (!notification) {
      return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
    }

    await this.notificationRepository.remove(notification)

    return { code: ResponseCode.OK }
  }
}
