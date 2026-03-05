import { autoInjectable, singleton } from 'tsyringe'
import { SupportRequestService } from './supportRequestService'
import { NextFunction, Request, Response } from 'express'

@singleton()
@autoInjectable()
export class SupportRequestController {
  constructor(private readonly supportRequestService: SupportRequestService) {}

  public createSupportRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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

  public updateSupportRequestStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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

  public getAllSupportRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { page, limit, status } = req.query

    const { code, supportRequests, pagination } =
      await this.supportRequestService.getAllSupportRequests({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as any,
      })

    return next({
      code,
      data: {
        supportRequests,
        pagination,
      },
    })
  }
}
