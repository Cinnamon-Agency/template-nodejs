import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '../../interface'
import { autoInjectable, container } from 'tsyringe'
import { NotificationService } from './notificationService'
import { WebSocketService } from '../../services/websocket'

const webSocketService = container.resolve(WebSocketService)

@autoInjectable()
export class NotificationController {
  private readonly notificationService: NotificationService

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService
  }

  getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.user
    const { unread, numberOfFetched } = res.locals.input

    const { notifications, code } =
      await this.notificationService.getNotifications({
        userId: id,
        unread,
        numberOfFetched
      })
    if (!notifications) {
      return next({ code })
    }

    return next({
      data: {
        notifications
      },
      code: ResponseCode.OK
    })
  }

  toogleReadStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.user
    const { notificationId, read } = res.locals.input

    const { code } = await this.notificationService.toogleReadStatus({
      notificationId,
      userId: id,
      read
    })

    return next({
      code
    })
  }

  deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.user
    const { notificationId } = res.locals.input

    const { code } = await this.notificationService.deleteNotification({
      notificationId,
      userId: id
    })

    webSocketService.emit(`${id}_delete_notif`, { notificationId })

    return next({ code })
  }
}
