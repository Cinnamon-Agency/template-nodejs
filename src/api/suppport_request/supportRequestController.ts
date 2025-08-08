import { autoInjectable } from 'tsyringe'
import { SupportRequestService } from './suppportRequestService'
import { NextFunction, Request, Response } from 'express'
import { logEndpoint } from '@common/decorators/logEndpoint'

@autoInjectable()
export class SupportRequestController {
  private readonly supportRequestService: SupportRequestService

  constructor(supportRequestService: SupportRequestService) {
    this.supportRequestService = supportRequestService
  }

  @logEndpoint()
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
      message
    })

    return next({
      code
    })
  }

  @logEndpoint()
  public async updateSupportRequestStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { supportRequestId, status } = res.locals.input

    const { code } =
      await this.supportRequestService.updateSupportRequestStatus({
        supportRequestId,
        status
      })

    return next({
      code
    })
  }
}
