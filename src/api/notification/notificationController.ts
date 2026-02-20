import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'
import { autoInjectable, singleton } from 'tsyringe'
import { NotificationService } from './notificationService'
import { WebSocketService } from '@services/websocket'

@singleton()
@autoInjectable()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly webSocketService: WebSocketService
  ) {}

  public async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = req.user
    const { unread, page, perPage } = res.locals.input

    const { data, code } =
      await this.notificationService.getNotifications({
        userId: id,
        unread,
        page,
        perPage,
      })

    return next({ data, code })
  }

  public async toggleReadStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = req.user
    const { notificationId, read } = res.locals.input

    const { code } = await this.notificationService.toggleReadStatus({
      notificationId,
      userId: id,
      read,
    })

    return next({
      code,
    })
  }

  public async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = req.user
    const { notificationId } = res.locals.input

    const { code } = await this.notificationService.deleteNotification({
      notificationId,
      userId: id,
    })

    this.webSocketService.emit(`${id}_delete_notif`, { notificationId })

    return next({ code })
  }
}
