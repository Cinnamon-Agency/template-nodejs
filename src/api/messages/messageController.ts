import { NextFunction, Request, Response } from 'express'
import _ from 'lodash'
import { ResponseCode } from '../../interfaces'
import { MessageService } from './messageService'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class MessageController {
  private readonly messageService: MessageService

  constructor(messageService: MessageService) {
    this.messageService = messageService
  }

  getMessage = async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = res.locals.input

    const { message, code } = await this.messageService.getDynamicMessageBySlug(
      { slug }
    )
    if (!message) {
      return next({ code })
    }

    return next({ data: { ...message }, code: ResponseCode.OK })
  }
}
