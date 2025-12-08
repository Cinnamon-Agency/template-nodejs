import { autoInjectable } from 'tsyringe'
import { SupportRequestService } from './supportRequestService'
import { NextFunction, Request, Response } from 'express'

@autoInjectable()
export class SupportRequestController {
  constructor(private readonly supportRequestService: SupportRequestService) {}

  public async createSupportRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { firstName, lastName, email, subject, message } = res.locals.input

    const { code } = await this.supportRequestService.createSupportRequest({
      firstName,
      lastName,
      email,
      subject,
      message,
    })

    return next({
      code,
    })
  }

  public async updateSupportRequestStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { supportRequestId, status } = res.locals.input

    const { code } =
      await this.supportRequestService.updateSupportRequestStatus({
        supportRequestId,
        status,
      })

    return next({
      code,
    })
  }
}
