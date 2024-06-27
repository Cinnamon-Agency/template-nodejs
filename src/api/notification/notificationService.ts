import { ResponseCode } from '../../interface'
import { logger } from '../../logger'
import { getResponseMessage } from '../../services/utils'
import { autoInjectable, container } from 'tsyringe'
import { AppDataSource } from '../../services/typeorm'
import { Notification } from './notificationModel'
import { Repository } from 'typeorm'
import {
  ICreateNotification,
  INotificationService,
  IGetNotifications,
  IDeleteNotification,
  IToogleReadStatus
} from './interface'
import { sendEmail } from '../../services/email'
import { UserService } from '../user/userService'

const userService = container.resolve(UserService)

@autoInjectable()
export class NotificationService implements INotificationService {
  private readonly notificationRepository: Repository<Notification>

  constructor() {
    this.notificationRepository =
      AppDataSource.manager.getRepository(Notification)
  }

  getNotifications = async ({
    userId,
    unread,
    numberOfFetched
  }: IGetNotifications) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const where: { receiverId: string; read?: boolean } = {
        receiverId: userId
      }
      if (unread) {
        where.read = false
      }
      const notifications = await this.notificationRepository.find({
        where,
        skip: numberOfFetched,
        take: 20
      })

      return { notifications, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  toogleReadStatus = async ({
    notificationId,
    userId,
    read
  }: IToogleReadStatus) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const notification = await this.notificationRepository.findOne({
        where: {
          receiverId: userId,
          id: notificationId
        }
      })

      if (!notification) {
        return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
      }

      notification.read = read

      await this.notificationRepository.save(notification)

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  createNotification = async ({
    receiverId,
    senderId,
    message,
    type
  }: ICreateNotification) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const notification = { receiverId, senderId, message, read: false, type }
      await this.notificationRepository.save(notification)

      const { user, code } = await userService.getUserById({
        userId: receiverId
      })

      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      sendEmail({
        revieverMail: user.email,
        message: { title: type, content: message }
      })

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  deleteNotification = async ({
    userId,
    notificationId
  }: IDeleteNotification) => {
    let code: ResponseCode = ResponseCode.OK
    try {
      const notification = await this.notificationRepository.findOne({
        where: {
          receiverId: userId,
          id: notificationId
        }
      })

      if (!notification) {
        return { code: ResponseCode.NOTIFICATION_NOT_FOUND }
      }

      await this.notificationRepository.remove(notification)

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }
    return { code }
  }
}
