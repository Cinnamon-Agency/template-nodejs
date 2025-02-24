import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'
import { autoInjectable, singleton } from 'tsyringe'
import { UserService } from './userService'

@singleton()
@autoInjectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user

    const { user, code } = await this.userService.getUserById({ userId: id })

    if (!user) {
      return next({ code })
    }

    return next({
      data: {
        user,
      },
      code: ResponseCode.OK,
    })
  }

  toogleNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.user

    const { code } = await this.userService.toggleNotifications({ userId: id })

    return next({
      code,
    })
  }

  getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = res.locals.input

    const { user, code } = await this.userService.getUserById({ userId: id })

    if (!user) {
      return next({ code })
    }

    return next({
      data: {
        user,
      },
      code: ResponseCode.OK,
    })
  }
}
