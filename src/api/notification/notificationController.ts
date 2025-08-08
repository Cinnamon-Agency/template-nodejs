import { NextFunction, Request, Response } from 'express'
import { logEndpoint } from '@common/decorators/logEndpoint'
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

  @logEndpoint()
  public async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = req.user
    const { unread, numberOfFetched } = res.locals.input

    const { notifications, code } =
      await this.notificationService.getNotifications({
        userId: id,
        unread,
        numberOfFetched,
      })
    if (!notifications) {
      return next({ code })
    }

    return next({
      data: {
        notifications,
      },
      code: ResponseCode.OK,
    })
  }

  @logEndpoint()
  public async toogleReadStatus(
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

  @logEndpoint()
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
